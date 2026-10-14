import { db } from "./db";
import { getSettings } from "./settings";
import { notify, audit } from "./notify";
import { awardValidationPoints, awardSuggestionBonus, revokePoints } from "./points";
import { addBusinessDays, distanceM } from "./format";
import { CATEGORY_LABEL, RISK_LABEL, type Category, type Risk } from "./constants";

export class WorkflowError extends Error {}

export async function nextReportNumber(date = new Date()) {
  const ym = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `PDL-${ym}-`;
  const last = await db.report.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: "desc" }, select: { number: true } });
  const seq = last ? parseInt(last.number.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

/** Menentukan area kerja dari koordinat; mengembalikan area terdekat dan apakah di luar radius */
export async function resolveArea(lat: number | null, lng: number | null, fallbackAreaId?: string | null) {
  const areas = await db.area.findMany({ where: { active: true } });
  if (lat == null || lng == null) {
    return { areaId: fallbackAreaId ?? null, outsideArea: false, flag: "Tanpa koordinat GPS, area diambil dari profil pelapor." };
  }
  let best: { id: string; name: string; dist: number; radius: number } | null = null;
  for (const a of areas) {
    if (a.lat == null || a.lng == null) continue;
    const dist = distanceM(lat, lng, a.lat, a.lng);
    if (!best || dist < best.dist) best = { id: a.id, name: a.name, dist, radius: a.radiusM };
  }
  if (!best) return { areaId: fallbackAreaId ?? null, outsideArea: false, flag: null as string | null };
  if (best.dist <= best.radius) return { areaId: best.id, outsideArea: false, flag: null as string | null };
  return {
    areaId: fallbackAreaId ?? best.id,
    outsideArea: true,
    flag: `Lokasi ${Math.round(best.dist)} m dari pusat area terdekat (${best.name}), di luar radius ${best.radius} m. Perlu ditinjau.`,
  };
}

async function managersForArea(areaId: string | null, excludeId?: string) {
  const managers = await db.user.findMany({ where: { role: "MANAGER", status: "ACTIVE" }, include: { managedAreas: true } });
  const inArea = managers.filter((m) => m.id !== excludeId && (m.managedAreas.some((a) => a.id === areaId) || m.areaId === areaId));
  const list = inArea.length ? inArea : managers.filter((m) => m.id !== excludeId);
  return list.map((m) => m.id);
}

async function verifiersFor(reporter: { id: string; atasanId: string | null; areaId: string | null }) {
  if (reporter.atasanId) {
    const atasan = await db.user.findUnique({ where: { id: reporter.atasanId } });
    if (atasan && atasan.role === "SUPERINTENDENT" && atasan.status === "ACTIVE") return [atasan.id];
  }
  const same = await db.user.findMany({ where: { role: "SUPERINTENDENT", status: "ACTIVE", areaId: reporter.areaId ?? undefined } });
  if (same.length) return same.map((s) => s.id);
  const all = await db.user.findMany({ where: { role: "SUPERINTENDENT", status: "ACTIVE" } });
  return all.map((s) => s.id);
}

export type NewReportInput = {
  reporterId: string;
  category: Category;
  riskLevel: Risk;
  description: string;
  suggestion?: string | null;
  areaLabel?: string | null;
  lat?: number | null;
  lng?: number | null;
  accuracyM?: number | null;
  clientCreatedAt?: Date | null;
  syncedOffline?: boolean;
  photos: Array<{ mime: string; data: Uint8Array<ArrayBuffer>; width?: number; height?: number }>;
};

export async function createReport(input: NewReportInput) {
  const reporter = await db.user.findUnique({ where: { id: input.reporterId } });
  if (!reporter || reporter.status !== "ACTIVE") throw new WorkflowError("Pengguna tidak aktif.");
  const settings = await getSettings();
  const now = new Date();
  const path = reporter.role === "PENGAWAS" ? "A" : "B";
  const { areaId, outsideArea, flag } = await resolveArea(input.lat ?? null, input.lng ?? null, reporter.areaId);
  const number = await nextReportNumber(now);
  const highRisk = input.riskLevel === "TINGGI" || input.riskLevel === "EKSTREM";
  const status = path === "A" ? "MENUNGGU_VERIFIKASI" : "MENUNGGU_KEPUTUSAN";

  const report = await db.report.create({
    data: {
      number,
      reporterId: reporter.id,
      path,
      areaId,
      areaLabel: input.areaLabel ?? null,
      category: input.category,
      riskLevel: input.riskLevel,
      description: input.description,
      suggestion: input.suggestion || null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      accuracyM: input.accuracyM ?? null,
      outsideArea,
      locationFlag: flag,
      clientCreatedAt: input.clientCreatedAt ?? null,
      syncedOffline: !!input.syncedOffline,
      status,
      escalated: path === "A" && highRisk && settings.escalateHighRisk,
      dueVerifyAt: path === "A" ? addBusinessDays(now, settings.verifyDeadlineDays) : null,
      dueDecideAt: path === "B" ? addBusinessDays(now, settings.decideDeadlineDays) : null,
      photos: { create: input.photos.map((p) => ({ mime: p.mime, data: p.data, width: p.width, height: p.height, size: p.data.length, kind: "LAPORAN" })) },
      events: { create: { type: "DIBUAT", actorId: reporter.id, toStatus: status, note: input.syncedOffline ? "Dikirim dari antrean luring" : null } },
    },
  });

  const summary = `${CATEGORY_LABEL[input.category]} - risiko ${RISK_LABEL[input.riskLevel]}`;
  if (path === "A") {
    const verifiers = await verifiersFor(reporter);
    await notify(verifiers, `Laporan baru perlu verifikasi: ${number}`, summary, `/laporan/${report.id}`);
    if (report.escalated) {
      const managers = await managersForArea(areaId);
      await notify(managers, `Eskalasi risiko ${RISK_LABEL[input.riskLevel]}: ${number}`, `${summary}. Menunggu verifikasi Superintendent.`, `/laporan/${report.id}`);
      await db.reportEvent.create({ data: { reportId: report.id, type: "DIESKALASI", note: "Eskalasi otomatis risiko Tinggi/Ekstrem ke Manager" } });
    }
  } else {
    const managers = await managersForArea(areaId, reporter.role === "MANAGER" && settings.managerPeerReview ? reporter.id : undefined);
    await notify(managers, `Laporan baru menunggu keputusan: ${number}`, summary, `/laporan/${report.id}`);
  }
  await audit(reporter.id, "LAPORAN_DIBUAT", "Report", report.id, { number, path, status });
  return report;
}

async function loadReport(id: string) {
  const r = await db.report.findUnique({ where: { id }, include: { reporter: true, area: true } });
  if (!r) throw new WorkflowError("Laporan tidak ditemukan.");
  return r;
}

export async function canVerify(user: { id: string; role: string; areaId: string | null }, report: { status: string; reporter: { atasanId: string | null; areaId: string | null } }) {
  if (report.status !== "MENUNGGU_VERIFIKASI") return false;
  if (user.role === "ADMIN") return true;
  if (user.role !== "SUPERINTENDENT") return false;
  return report.reporter.atasanId === user.id || (!!user.areaId && report.reporter.areaId === user.areaId) || !report.reporter.atasanId;
}

export async function verifyReport(actorId: string, reportId: string, result: "VALID" | "REVISI" | "TOLAK", note: string) {
  const actor = await db.user.findUnique({ where: { id: actorId } });
  const report = await loadReport(reportId);
  if (!actor || !(await canVerify(actor, report))) throw new WorkflowError("Anda tidak berwenang memverifikasi laporan ini.");
  if (result !== "VALID" && !note.trim()) throw new WorkflowError("Catatan wajib diisi untuk revisi atau penolakan.");
  const settings = await getSettings();
  const now = new Date();
  const toStatus = result === "VALID" ? "MENUNGGU_KEPUTUSAN" : result === "REVISI" ? "PERLU_REVISI" : "DITOLAK";
  await db.report.update({
    where: { id: reportId },
    data: {
      status: toStatus,
      verifierId: actorId,
      verifiedAt: now,
      verificationResult: result,
      verificationNote: note || null,
      revisionCount: result === "REVISI" ? { increment: 1 } : undefined,
      dueDecideAt: result === "VALID" ? addBusinessDays(now, settings.decideDeadlineDays) : undefined,
      isDuplicate: result === "TOLAK" && /ganda|duplikat/i.test(note) ? true : undefined,
      events: { create: { type: result === "VALID" ? "DIVERIFIKASI" : result === "REVISI" ? "DIREVISI" : "DITOLAK", actorId, fromStatus: "MENUNGGU_VERIFIKASI", toStatus, note } },
    },
  });
  let points = 0;
  if (result === "VALID") {
    points = await awardValidationPoints(reportId, settings);
    const managers = await managersForArea(report.areaId);
    await notify(managers, `Laporan terverifikasi, menunggu keputusan: ${report.number}`, `${CATEGORY_LABEL[report.category as Category]} - risiko ${RISK_LABEL[report.riskLevel as Risk]}`, `/laporan/${reportId}`);
    await notify([report.reporterId], `Laporan ${report.number} dinyatakan valid`, points > 0 ? `Anda memperoleh ${points} poin.` : "Laporan diteruskan ke Manager.", `/laporan/${reportId}`);
  } else if (result === "REVISI") {
    await notify([report.reporterId], `Laporan ${report.number} perlu revisi`, note, `/laporan/${reportId}`);
  } else {
    await notify([report.reporterId], `Laporan ${report.number} ditolak`, note, `/laporan/${reportId}`);
  }
  await audit(actorId, "LAPORAN_DIVERIFIKASI", "Report", reportId, { result, points });
}

export async function resubmitReport(actorId: string, reportId: string, data: { description: string; suggestion?: string | null; areaLabel?: string | null; riskLevel: Risk; category: Category; note?: string }) {
  const report = await loadReport(reportId);
  if (report.reporterId !== actorId) throw new WorkflowError("Hanya pelapor yang dapat merevisi laporan.");
  if (report.status !== "PERLU_REVISI") throw new WorkflowError("Laporan tidak dalam status perlu revisi.");
  const settings = await getSettings();
  const { note, ...fields } = data;
  await db.report.update({
    where: { id: reportId },
    data: {
      ...fields,
      status: "MENUNGGU_VERIFIKASI",
      dueVerifyAt: addBusinessDays(new Date(), settings.verifyDeadlineDays),
      events: { create: { type: "REVISI_DIKIRIM", actorId, fromStatus: "PERLU_REVISI", toStatus: "MENUNGGU_VERIFIKASI", note } },
    },
  });
  const verifiers = report.verifierId ? [report.verifierId] : await verifiersFor(report.reporter);
  await notify(verifiers, `Revisi laporan ${report.number} dikirim`, note, `/laporan/${reportId}`);
  await audit(actorId, "LAPORAN_DIREVISI", "Report", reportId);
}

export function canDecide(user: { id: string; role: string }, report: { status: string; reporterId: string; reporter: { role: string } }, peerReview: boolean) {
  if (report.status !== "MENUNGGU_KEPUTUSAN") return false;
  if (user.role === "ADMIN") return true;
  if (user.role !== "MANAGER") return false;
  if (peerReview && report.reporterId === user.id) return false;
  return true;
}

export type DecisionInput = {
  result: "SETUJU" | "TOLAK";
  note?: string;
  picId?: string | null;
  picName?: string | null;
  resourceTenaga?: string | null;
  resourceBiaya?: string | null;
  resourceMaterial?: string | null;
  targetDate?: Date | null;
  controlHierarchy?: string | null;
  rejectReason?: "GANDA" | "TIDAK_BENAR" | "TIDAK_PERLU_TINDAKAN";
};

export async function decideReport(actorId: string, reportId: string, input: DecisionInput) {
  const actor = await db.user.findUnique({ where: { id: actorId } });
  const report = await loadReport(reportId);
  const settings = await getSettings();
  if (!actor || !canDecide(actor, report, settings.managerPeerReview)) throw new WorkflowError("Anda tidak berwenang memutuskan laporan ini.");
  const now = new Date();
  if (input.result === "SETUJU") {
    if (!input.picId && !input.picName?.trim()) throw new WorkflowError("Penanggung jawab wajib ditetapkan.");
    if (!input.targetDate) throw new WorkflowError("Target selesai wajib diisi.");
    if (!input.controlHierarchy) throw new WorkflowError("Pilih hierarki pengendalian.");
    const pic = input.picId ? await db.user.findUnique({ where: { id: input.picId } }) : null;
    await db.report.update({
      where: { id: reportId },
      data: {
        status: "DALAM_PERBAIKAN",
        deciderId: actorId,
        decidedAt: now,
        decisionResult: "SETUJU",
        decisionNote: input.note || null,
        picId: pic?.id ?? null,
        picName: input.picName?.trim() || pic?.name || null,
        resourceTenaga: input.resourceTenaga || null,
        resourceBiaya: input.resourceBiaya || null,
        resourceMaterial: input.resourceMaterial || null,
        targetDate: input.targetDate,
        controlHierarchy: input.controlHierarchy,
        events: { create: { type: "DIPUTUSKAN", actorId, fromStatus: "MENUNGGU_KEPUTUSAN", toStatus: "DALAM_PERBAIKAN", note: `Setujui. PIC: ${input.picName?.trim() || pic?.name}. ${input.note ?? ""}`.trim() } },
      },
    });
    let points = 0;
    if (report.path === "B") points = await awardValidationPoints(reportId, settings);
    await notify([report.reporterId], `Laporan ${report.number} disetujui Manager`, `${points > 0 ? `Anda memperoleh ${points} poin. ` : ""}Perbaikan ditargetkan selesai ${input.targetDate.toLocaleDateString("id-ID")}.`, `/laporan/${reportId}`);
    if (pic && pic.id !== report.reporterId) await notify([pic.id], `Anda ditunjuk sebagai penanggung jawab: ${report.number}`, report.description, `/laporan/${reportId}`);
    await audit(actorId, "LAPORAN_DISETUJUI", "Report", reportId, { pic: pic?.id ?? input.picName, target: input.targetDate, points });
  } else {
    if (!input.note?.trim()) throw new WorkflowError("Alasan penolakan wajib diisi.");
    const reason = input.rejectReason ?? "TIDAK_BENAR";
    await db.report.update({
      where: { id: reportId },
      data: {
        status: "DITOLAK",
        deciderId: actorId,
        decidedAt: now,
        decisionResult: "TOLAK",
        decisionNote: input.note,
        isDuplicate: reason === "GANDA",
        events: { create: { type: "DITOLAK", actorId, fromStatus: "MENUNGGU_KEPUTUSAN", toStatus: "DITOLAK", note: input.note } },
      },
    });
    if (reason === "GANDA" || reason === "TIDAK_BENAR") await revokePoints(reportId, reason === "GANDA" ? "laporan ganda" : "laporan tidak benar");
    await notify([report.reporterId], `Laporan ${report.number} ditolak Manager`, input.note, `/laporan/${reportId}`);
    await audit(actorId, "LAPORAN_DITOLAK", "Report", reportId, { reason });
  }
}

export function canProgress(user: { id: string; role: string }, report: { status: string; picId: string | null; deciderId: string | null }) {
  if (report.status !== "DALAM_PERBAIKAN") return false;
  return user.role === "ADMIN" || user.role === "MANAGER" || report.picId === user.id || report.deciderId === user.id;
}

export async function updateProgress(actorId: string, reportId: string, pct: number, note: string, done: boolean, photo?: { mime: string; data: Uint8Array<ArrayBuffer> }) {
  const actor = await db.user.findUnique({ where: { id: actorId } });
  const report = await loadReport(reportId);
  if (!actor || !canProgress(actor, report)) throw new WorkflowError("Anda tidak berwenang memperbarui progres laporan ini.");
  const now = new Date();
  const pctFinal = done ? 100 : Math.max(0, Math.min(99, pct));
  await db.report.update({
    where: { id: reportId },
    data: {
      progressPct: pctFinal,
      status: done ? "MENUNGGU_PENUTUPAN" : "DALAM_PERBAIKAN",
      completedAt: done ? now : undefined,
      completionNote: done ? note : undefined,
      photos: photo ? { create: { mime: photo.mime, data: photo.data, size: photo.data.length, kind: "PERBAIKAN" } } : undefined,
      events: { create: { type: done ? "SELESAI_PERBAIKAN" : "PROGRES", actorId, fromStatus: "DALAM_PERBAIKAN", toStatus: done ? "MENUNGGU_PENUTUPAN" : "DALAM_PERBAIKAN", note: `${pctFinal}% - ${note}` } },
    },
  });
  if (done) {
    await notify([report.deciderId, report.verifierId].filter((x) => x !== actorId), `Perbaikan ${report.number} dilaporkan selesai`, note, `/laporan/${reportId}`);
  }
  await audit(actorId, done ? "PERBAIKAN_SELESAI" : "PROGRES_DIPERBARUI", "Report", reportId, { pct: pctFinal });
}

export function canClose(user: { id: string; role: string }, report: { status: string; verifierId: string | null; deciderId: string | null }) {
  if (report.status !== "MENUNGGU_PENUTUPAN") return false;
  return user.role === "ADMIN" || user.role === "MANAGER" || (user.role === "SUPERINTENDENT" && report.verifierId === user.id);
}

export async function closeReport(actorId: string, reportId: string, accepted: boolean, note: string, suggestionApplied: boolean) {
  const actor = await db.user.findUnique({ where: { id: actorId } });
  const report = await loadReport(reportId);
  if (!actor || !canClose(actor, report)) throw new WorkflowError("Anda tidak berwenang menutup laporan ini.");
  const settings = await getSettings();
  const now = new Date();
  if (!accepted) {
    if (!note.trim()) throw new WorkflowError("Catatan wajib diisi bila hasil perbaikan belum diterima.");
    await db.report.update({
      where: { id: reportId },
      data: { status: "DALAM_PERBAIKAN", progressPct: 80, completedAt: null, events: { create: { type: "PROGRES", actorId, fromStatus: "MENUNGGU_PENUTUPAN", toStatus: "DALAM_PERBAIKAN", note: `Hasil belum diterima: ${note}` } } },
    });
    await notify([report.picId, report.reporterId], `Perbaikan ${report.number} perlu disempurnakan`, note, `/laporan/${reportId}`);
    await audit(actorId, "PENUTUPAN_DITOLAK", "Report", reportId);
    return;
  }
  const onTime = report.targetDate ? (report.completedAt ?? now) <= report.targetDate : null;
  await db.report.update({
    where: { id: reportId },
    data: {
      status: "SELESAI",
      closerId: actorId,
      closedAt: now,
      closureNote: note || null,
      closedOnTime: onTime,
      events: { create: { type: "DITUTUP", actorId, fromStatus: "MENUNGGU_PENUTUPAN", toStatus: "SELESAI", note } },
    },
  });
  let bonus = 0;
  if (suggestionApplied) bonus = await awardSuggestionBonus(reportId, settings);
  await notify([report.reporterId, report.picId].filter((x) => x !== actorId), `Laporan ${report.number} ditutup`, bonus > 0 ? `Usulan perbaikan Anda diterapkan, bonus ${bonus} poin.` : "Hasil perbaikan telah diverifikasi.", `/laporan/${reportId}`);
  await audit(actorId, "LAPORAN_DITUTUP", "Report", reportId, { onTime, bonus });
}

/** Scope daftar laporan sesuai peran */
export function reportScope(user: { id: string; role: string; areaId: string | null }) {
  switch (user.role) {
    case "ADMIN":
    case "DIREKSI":
    case "MANAGER":
      return {};
    case "SUPERINTENDENT":
      return { OR: [{ reporterId: user.id }, { picId: user.id }, { verifierId: user.id }, { reporter: { atasanId: user.id } }, ...(user.areaId ? [{ areaId: user.areaId }] : [])] };
    default:
      return { OR: [{ reporterId: user.id }, { picId: user.id }] };
  }
}
