import { db } from "./db";
import { getSettings } from "./settings";
import { notify, audit } from "./notify";
import { awardValidationPoints, awardSuggestionBonus, revokePoints } from "./points";
import { addBusinessDays, distanceM, jktParts } from "./format";
import { Prisma } from "@prisma/client";
import { CATEGORY_LABEL, RISK_LABEL, type Category, type Risk, type HazardType, type RejectReason } from "./constants";

export class WorkflowError extends Error {}

/** Nomor laporan unik per bulan (WIB) dari pencacah atomik di basis data */
export async function nextReportNumber(date = new Date()) {
  const { y, m0 } = jktParts(date);
  const ym = `${y}${String(m0 + 1).padStart(2, "0")}`;
  const key = `report:${ym}`;
  for (let i = 0; i < 3; i++) {
    try {
      const c = await db.counter.upsert({ where: { key }, create: { key, value: 1 }, update: { value: { increment: 1 } } });
      return `PDL-${ym}-${String(c.value).padStart(4, "0")}`;
    } catch (e) {
      if (!isUniqueError(e)) throw e; // tabrakan pembuatan baris pertama, ulangi
    }
  }
  throw new WorkflowError("Gagal menetapkan nomor laporan. Coba lagi.");
}

/** Memastikan transisi status atomik: gagal bila status sudah berubah oleh proses lain */
async function transition(tx: Tx, reportId: string, fromStatus: string | string[], data: Prisma.ReportUncheckedUpdateManyInput) {
  const res = await tx.report.updateMany({ where: { id: reportId, status: Array.isArray(fromStatus) ? { in: fromStatus } : fromStatus }, data });
  if (res.count !== 1) throw new WorkflowError("Status laporan sudah berubah. Muat ulang halaman.");
}

function isUniqueError(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
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

/**
 * Lokasi dipilih pelapor dari daftar area; koordinat GPS hanya pelengkap untuk memeriksa kesesuaian.
 * Bila area tidak dikirim (antrean luring versi lama), area ditentukan dari koordinat seperti sebelumnya.
 */
export async function checkChosenArea(areaId: string | null | undefined, lat: number | null, lng: number | null, fallbackAreaId?: string | null) {
  if (!areaId) return resolveArea(lat, lng, fallbackAreaId);
  const area = await db.area.findFirst({ where: { id: areaId, active: true } });
  if (!area) throw new WorkflowError("Lokasi yang dipilih tidak ditemukan atau tidak aktif.");
  if (lat == null || lng == null || area.lat == null || area.lng == null) return { areaId: area.id, outsideArea: false, flag: null as string | null };
  const dist = distanceM(lat, lng, area.lat, area.lng);
  if (dist <= area.radiusM) return { areaId: area.id, outsideArea: false, flag: null as string | null };
  return { areaId: area.id, outsideArea: true, flag: `Koordinat GPS ${Math.round(dist)} m dari pusat ${area.name}, di luar radius ${area.radiusM} m. Perlu ditinjau.` };
}

/** Manager aktif yang menangani area; cadangan: seluruh Manager aktif */
export async function managersForArea(areaId: string | null, excludeId?: string) {
  const managers = await db.user.findMany({ where: { role: "MANAGER", status: "ACTIVE" }, select: { id: true, areaId: true, managedAreas: { select: { id: true } } } });
  const pool = managers.filter((m) => m.id !== excludeId);
  const inArea = areaId ? pool.filter((m) => m.managedAreas.some((a) => a.id === areaId) || m.areaId === areaId) : [];
  return (inArea.length ? inArea : pool).map((m) => m.id);
}

const INVALID_ATASAN: Prisma.UserWhereInput = { OR: [{ atasanId: null }, { atasan: { is: { OR: [{ role: { not: "SUPERINTENDENT" } }, { status: { not: "ACTIVE" } }] } } }] };

/**
 * Satu-satunya aturan siapa yang boleh memverifikasi laporan Pengawas. Dipakai bersama oleh antrean
 * verifikasi, hak lihat (reportScope), tombol verifikasi (canVerify), notifikasi, dan pengingat.
 * Superintendent boleh memverifikasi bila: ia atasan pelapor, atau laporan/pelapor berada di areanya,
 * atau pelapor tidak memiliki atasan Superintendent yang aktif.
 */
export function verifiableWhere(user: { id: string; areaId: string | null }): Prisma.ReportWhereInput {
  return {
    status: "MENUNGGU_VERIFIKASI",
    OR: [
      { reporter: { atasanId: user.id } },
      ...(user.areaId ? [{ areaId: user.areaId }, { reporter: { areaId: user.areaId } }] : []),
      { reporter: INVALID_ATASAN },
    ],
  };
}

/** Superintendent aktif yang menerima tugas verifikasi untuk laporan ini (selaras dengan verifiableWhere) */
export async function verifiersFor(reporter: { atasanId: string | null; areaId: string | null }, reportAreaId: string | null) {
  if (reporter.atasanId) {
    const atasan = await db.user.findUnique({ where: { id: reporter.atasanId }, select: { id: true, role: true, status: true } });
    if (atasan && atasan.role === "SUPERINTENDENT" && atasan.status === "ACTIVE") return [atasan.id];
  }
  const areas = [reportAreaId, reporter.areaId].filter((x): x is string => !!x);
  if (areas.length) {
    const same = await db.user.findMany({ where: { role: "SUPERINTENDENT", status: "ACTIVE", areaId: { in: areas } }, select: { id: true } });
    if (same.length) return same.map((s) => s.id);
  }
  const all = await db.user.findMany({ where: { role: "SUPERINTENDENT", status: "ACTIVE" }, select: { id: true } });
  return all.map((s) => s.id);
}

type Tx = Prisma.TransactionClient;

/** Menjalankan perubahan status dan seluruh tulisan terkait secara atomik */
function inTx<T>(fn: (tx: Tx) => Promise<T>) {
  return db.$transaction(fn, { timeout: 15000, maxWait: 10000 });
}

export type NewReportInput = {
  reporterId: string;
  category: Category;
  riskLevel: Risk;
  hazardType?: HazardType | null;
  description: string;
  impact?: string | null;
  immediateAction?: string | null;
  suggestion?: string | null;
  proposedPicId?: string | null;
  areaId?: string | null;
  areaLabel?: string | null;
  lat?: number | null;
  lng?: number | null;
  accuracyM?: number | null;
  clientCreatedAt?: Date | null;
  syncedOffline?: boolean;
  clientId?: string | null;
  photos: Array<{ mime: string; data: Uint8Array<ArrayBuffer>; thumb?: Uint8Array<ArrayBuffer> | null; width?: number; height?: number }>;
};

export async function createReport(input: NewReportInput) {
  const reporter = await db.user.findUnique({ where: { id: input.reporterId } });
  if (!reporter || reporter.status !== "ACTIVE") throw new WorkflowError("Pengguna tidak aktif.");
  const settings = await getSettings();
  const now = new Date();
  const path = reporter.role === "PENGAWAS" ? "A" : "B";
  const { areaId, outsideArea, flag } = await checkChosenArea(input.areaId, input.lat ?? null, input.lng ?? null, reporter.areaId);
  if (input.proposedPicId) {
    const pic = await db.user.findUnique({ where: { id: input.proposedPicId }, select: { status: true } });
    if (!pic || pic.status !== "ACTIVE") throw new WorkflowError("Penanggung jawab yang diusulkan tidak ditemukan atau tidak aktif.");
  }
  const highRisk = input.riskLevel === "TINGGI" || input.riskLevel === "EKSTREM";
  const status = path === "A" ? "MENUNGGU_VERIFIKASI" : "MENUNGGU_KEPUTUSAN";

  // Idempoten: pengiriman ulang dengan clientId yang sama mengembalikan laporan yang sudah ada
  if (input.clientId) {
    const existing = await db.report.findUnique({ where: { clientId: input.clientId } });
    if (existing) return { report: existing, duplicate: true };
  }

  // Nomor laporan dari pencacah atomik; ulangi bila ternyata sudah terpakai (data lama tanpa pencacah)
  let report: Awaited<ReturnType<typeof db.report.create>> | null = null;
  let number = "";
  const escalated = path === "A" && highRisk && settings.escalateHighRisk;
  for (let attempt = 0; attempt < 50 && !report; attempt++) {
    number = await nextReportNumber(now);
    try {
      report = await db.report.create({
        data: {
          number,
          clientId: input.clientId || null,
          reporterId: reporter.id,
          path,
          areaId,
          areaLabel: input.areaLabel ?? null,
          category: input.category,
          riskLevel: input.riskLevel,
          hazardType: input.hazardType ?? null,
          description: input.description,
          impact: input.impact || null,
          immediateAction: input.immediateAction || null,
          suggestion: input.suggestion || null,
          proposedPicId: input.proposedPicId || null,
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          accuracyM: input.accuracyM ?? null,
          outsideArea,
          locationFlag: flag,
          clientCreatedAt: input.clientCreatedAt ?? null,
          syncedOffline: !!input.syncedOffline,
          status,
          escalated,
          dueVerifyAt: path === "A" ? addBusinessDays(now, settings.verifyDeadlineDays) : null,
          dueDecideAt: path === "B" ? addBusinessDays(now, settings.decideDeadlineDays) : null,
          photos: { create: input.photos.map((p) => ({ mime: p.mime, data: p.data, thumb: p.thumb ?? null, width: p.width, height: p.height, size: p.data.length, kind: "LAPORAN" })) },
          events: {
            create: [
              { type: "DIBUAT", actorId: reporter.id, toStatus: status, note: input.syncedOffline ? "Dikirim dari antrean luring" : null, meta: input.clientId ?? null },
              ...(escalated ? [{ type: "DIESKALASI", note: "Eskalasi otomatis risiko Tinggi/Ekstrem ke Manager" }] : []),
            ],
          },
        },
      });
    } catch (e) {
      if (!isUniqueError(e)) throw e;
      const target = (e as Prisma.PrismaClientKnownRequestError).meta?.target;
      if (input.clientId && String(target ?? "").includes("clientId")) {
        const existing = await db.report.findUnique({ where: { clientId: input.clientId } });
        if (existing) return { report: existing, duplicate: true };
      }
    }
  }
  if (!report) throw new WorkflowError("Gagal menetapkan nomor laporan. Coba lagi.");

  const summary = `${CATEGORY_LABEL[input.category]} - risiko ${RISK_LABEL[input.riskLevel]}`;
  if (path === "A") {
    const verifiers = await verifiersFor(reporter, areaId);
    await notify(verifiers, `Laporan baru perlu verifikasi: ${number}`, summary, `/laporan/${report.id}`);
    if (report.escalated) {
      const managers = await managersForArea(areaId);
      await notify(managers, `Eskalasi risiko ${RISK_LABEL[input.riskLevel]}: ${number}`, `${summary}. Menunggu verifikasi Superintendent.`, `/laporan/${report.id}`);
    }
  } else {
    const managers = await managersForArea(areaId, reporter.role === "MANAGER" && settings.managerPeerReview ? reporter.id : undefined);
    await notify(managers, `Laporan baru menunggu keputusan: ${number}`, summary, `/laporan/${report.id}`);
  }
  await audit(reporter.id, "LAPORAN_DIBUAT", "Report", report.id, { number, path, status });
  return { report, duplicate: false };
}

async function loadReport(id: string) {
  const r = await db.report.findUnique({ where: { id }, include: { reporter: true, area: true } });
  if (!r) throw new WorkflowError("Laporan tidak ditemukan.");
  return r;
}

export async function canVerify(user: { id: string; role: string; areaId: string | null; status?: string }, report: { id: string; status: string }) {
  if (report.status !== "MENUNGGU_VERIFIKASI") return false;
  if (user.status && user.status !== "ACTIVE") return false;
  if (user.role === "ADMIN") return true;
  if (user.role !== "SUPERINTENDENT") return false;
  const n = await db.report.count({ where: { AND: [{ id: report.id }, verifiableWhere(user)] } });
  return n === 1;
}

export async function verifyReport(actorId: string, reportId: string, result: "VALID" | "REVISI" | "TOLAK", note: string, rejectReason?: RejectReason) {
  const actor = await db.user.findUnique({ where: { id: actorId } });
  const report = await loadReport(reportId);
  if (!actor || !(await canVerify(actor, report))) throw new WorkflowError("Anda tidak berwenang memverifikasi laporan ini.");
  if (result !== "VALID" && !note.trim()) throw new WorkflowError("Catatan wajib diisi untuk revisi atau penolakan.");
  const settings = await getSettings();
  const now = new Date();
  const toStatus = result === "VALID" ? "MENUNGGU_KEPUTUSAN" : result === "REVISI" ? "PERLU_REVISI" : "DITOLAK";
  const points = await inTx(async (tx) => {
    await transition(tx, reportId, "MENUNGGU_VERIFIKASI", {
      status: toStatus,
      verifierId: actorId,
      verifiedAt: now,
      verificationResult: result,
      verificationNote: note || null,
      revisionCount: result === "REVISI" ? { increment: 1 } : undefined,
      dueDecideAt: result === "VALID" ? addBusinessDays(now, settings.decideDeadlineDays) : undefined,
      isDuplicate: result === "TOLAK" && (rejectReason === "GANDA" || /ganda|duplikat/i.test(note)) ? true : undefined,
      rejectReason: result === "TOLAK" ? rejectReason ?? "TIDAK_PERLU_TINDAKAN" : undefined,
    });
    await tx.reportEvent.create({ data: { reportId, type: result === "VALID" ? "DIVERIFIKASI" : result === "REVISI" ? "DIREVISI" : "DITOLAK", actorId, fromStatus: "MENUNGGU_VERIFIKASI", toStatus, note } });
    return result === "VALID" ? awardValidationPoints(tx, reportId, settings) : 0;
  });
  if (result === "VALID") {
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
  const highRisk = fields.riskLevel === "TINGGI" || fields.riskLevel === "EKSTREM";
  const escalate = report.path === "A" && highRisk && settings.escalateHighRisk;
  await inTx(async (tx) => {
    // Hasil verifikasi lama dihapus agar laporan kembali bersih ke antrean; riwayatnya tetap di ReportEvent
    await transition(tx, reportId, "PERLU_REVISI", {
      ...fields,
      status: "MENUNGGU_VERIFIKASI",
      dueVerifyAt: addBusinessDays(new Date(), settings.verifyDeadlineDays),
      verificationResult: null,
      verifiedAt: null,
      escalated: report.escalated || escalate,
    });
    await tx.reportEvent.create({ data: { reportId, type: "REVISI_DIKIRIM", actorId, fromStatus: "PERLU_REVISI", toStatus: "MENUNGGU_VERIFIKASI", note } });
    if (escalate && !report.escalated) await tx.reportEvent.create({ data: { reportId, type: "DIESKALASI", note: "Eskalasi otomatis: risiko dinaikkan saat revisi" } });
  });
  if (escalate && !report.escalated) {
    await notify(await managersForArea(report.areaId), `Eskalasi risiko ${RISK_LABEL[fields.riskLevel]}: ${report.number}`, "Risiko dinaikkan saat revisi. Menunggu verifikasi Superintendent.", `/laporan/${reportId}`);
  }
  const prev = report.verifierId ? await db.user.findUnique({ where: { id: report.verifierId }, select: { id: true, role: true, status: true } }) : null;
  const verifiers = prev && prev.status === "ACTIVE" && (prev.role === "SUPERINTENDENT" || prev.role === "ADMIN") ? [prev.id] : await verifiersFor(report.reporter, report.areaId);
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
  rejectReason?: RejectReason;
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
    if (input.picId && (!pic || pic.status !== "ACTIVE")) throw new WorkflowError("Penanggung jawab tidak ditemukan atau tidak aktif.");
    const points = await inTx(async (tx) => {
    await transition(tx, reportId, "MENUNGGU_KEPUTUSAN", {
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
    });
    await tx.reportEvent.create({ data: { reportId, type: "DIPUTUSKAN", actorId, fromStatus: "MENUNGGU_KEPUTUSAN", toStatus: "DALAM_PERBAIKAN", note: `Setujui. PIC: ${input.picName?.trim() || pic?.name}. ${input.note ?? ""}`.trim() } });
      // Jalur B tidak melewati verifikasi; poin diberikan saat disetujui. Jalur A sudah menerima poin saat diverifikasi.
      return awardValidationPoints(tx, reportId, settings);
    });
    await notify([report.reporterId], `Laporan ${report.number} disetujui Manager`, `${points > 0 ? `Anda memperoleh ${points} poin. ` : ""}Perbaikan ditargetkan selesai ${input.targetDate.toLocaleDateString("id-ID")}.`, `/laporan/${reportId}`);
    if (pic && pic.id !== report.reporterId) await notify([pic.id], `Anda ditunjuk sebagai penanggung jawab: ${report.number}`, report.description, `/laporan/${reportId}`);
    await audit(actorId, "LAPORAN_DISETUJUI", "Report", reportId, { pic: pic?.id ?? input.picName, target: input.targetDate, points });
  } else {
    if (!input.note?.trim()) throw new WorkflowError("Alasan penolakan wajib diisi.");
    const reason = input.rejectReason ?? "TIDAK_PERLU_TINDAKAN";
    const note = input.note;
    await inTx(async (tx) => {
      await transition(tx, reportId, "MENUNGGU_KEPUTUSAN", { status: "DITOLAK", deciderId: actorId, decidedAt: now, decisionResult: "TOLAK", decisionNote: note, isDuplicate: reason === "GANDA", rejectReason: reason });
      await tx.reportEvent.create({ data: { reportId, type: "DITOLAK", actorId, fromStatus: "MENUNGGU_KEPUTUSAN", toStatus: "DITOLAK", note } });
      if (reason === "GANDA" || reason === "TIDAK_BENAR") await revokePoints(tx, reportId, reason === "GANDA" ? "laporan ganda" : "laporan tidak benar");
    });
    await notify([report.reporterId], `Laporan ${report.number} ditolak Manager`, input.note, `/laporan/${reportId}`);
    await audit(actorId, "LAPORAN_DITOLAK", "Report", reportId, { reason });
  }
}

export function canProgress(user: { id: string; role: string }, report: { status: string; picId: string | null; deciderId: string | null }) {
  if (report.status !== "DALAM_PERBAIKAN") return false;
  return user.role === "ADMIN" || user.role === "MANAGER" || report.picId === user.id || report.deciderId === user.id;
}

export async function updateProgress(actorId: string, reportId: string, pct: number, note: string, done: boolean, photo?: { mime: string; data: Uint8Array<ArrayBuffer>; thumb?: Uint8Array<ArrayBuffer> | null }) {
  const actor = await db.user.findUnique({ where: { id: actorId } });
  const report = await loadReport(reportId);
  if (!actor || !canProgress(actor, report)) throw new WorkflowError("Anda tidak berwenang memperbarui progres laporan ini.");
  const now = new Date();
  const pctFinal = done ? 100 : Math.max(0, Math.min(99, pct));
  await inTx(async (tx) => {
    await transition(tx, reportId, "DALAM_PERBAIKAN", { progressPct: pctFinal, status: done ? "MENUNGGU_PENUTUPAN" : "DALAM_PERBAIKAN", completedAt: done ? now : undefined, completionNote: done ? note : undefined });
    if (photo) await tx.photo.create({ data: { reportId, mime: photo.mime, data: photo.data, thumb: photo.thumb ?? null, size: photo.data.length, kind: "PERBAIKAN" } });
    await tx.reportEvent.create({ data: { reportId, type: done ? "SELESAI_PERBAIKAN" : "PROGRES", actorId, fromStatus: "DALAM_PERBAIKAN", toStatus: done ? "MENUNGGU_PENUTUPAN" : "DALAM_PERBAIKAN", note: `${pctFinal}% - ${note}` } });
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
    await inTx(async (tx) => {
      await transition(tx, reportId, "MENUNGGU_PENUTUPAN", { status: "DALAM_PERBAIKAN", progressPct: 80, completedAt: null, completionNote: null });
      await tx.reportEvent.create({ data: { reportId, type: "PROGRES", actorId, fromStatus: "MENUNGGU_PENUTUPAN", toStatus: "DALAM_PERBAIKAN", note: `Hasil belum diterima: ${note}` } });
    });
    await notify([report.picId, report.reporterId], `Perbaikan ${report.number} perlu disempurnakan`, note, `/laporan/${reportId}`);
    await audit(actorId, "PENUTUPAN_DITOLAK", "Report", reportId);
    return;
  }
  const onTime = report.targetDate ? (report.completedAt ?? now) <= report.targetDate : null;
  const bonus = await inTx(async (tx) => {
    await transition(tx, reportId, "MENUNGGU_PENUTUPAN", { status: "SELESAI", closerId: actorId, closedAt: now, closureNote: note || null, closedOnTime: onTime });
    await tx.reportEvent.create({ data: { reportId, type: "DITUTUP", actorId, fromStatus: "MENUNGGU_PENUTUPAN", toStatus: "SELESAI", note } });
    return suggestionApplied ? awardSuggestionBonus(tx, reportId, settings) : 0;
  });
  await notify([report.reporterId, report.picId].filter((x) => x !== actorId), `Laporan ${report.number} ditutup`, bonus > 0 ? `Usulan perbaikan Anda diterapkan, bonus ${bonus} poin.` : "Hasil perbaikan telah diverifikasi.", `/laporan/${reportId}`);
  await audit(actorId, "LAPORAN_DITUTUP", "Report", reportId, { onTime, bonus });
}

/** Scope daftar laporan sesuai peran */
export function reportScope(user: { id: string; role: string; areaId: string | null }): Prisma.ReportWhereInput {
  switch (user.role) {
    case "ADMIN":
    case "DIREKSI":
    case "MANAGER":
      return {};
    case "SUPERINTENDENT":
      return { OR: [{ reporterId: user.id }, { picId: user.id }, { verifierId: user.id }, { reporter: { atasanId: user.id } }, ...(user.areaId ? [{ areaId: user.areaId }] : []), verifiableWhere(user)] };
    default:
      return { OR: [{ reporterId: user.id }, { picId: user.id }] };
  }
}
