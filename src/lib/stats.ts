import { db } from "./db";
import { CATEGORIES, RISKS, STATUSES, OPEN_STATUSES, CONTROLS, HAZARD_TYPES, REJECT_REASONS, type Category, type Risk, type Status } from "./constants";
import { daysBetween, hoursBetween, jktDate, jktParts } from "./format";

export type Period = { from: Date; to: Date };

export function monthPeriod(year: number, month0: number): Period {
  return { from: jktDate(year, month0, 1), to: jktDate(year, month0 + 1, 1) };
}

/** Periode bulan berjalan menurut WIB */
export function currentMonthPeriod(now = new Date()): Period {
  const { y, m0 } = jktParts(now);
  return monthPeriod(y, m0);
}

/**
 * Periode pembanding. Bila periode tepat satu atau beberapa bulan kalender (WIB), pembandingnya adalah
 * bulan kalender sebelumnya dengan jumlah bulan yang sama; selain itu, rentang dengan panjang yang sama tepat sebelumnya.
 */
export function previousPeriod(p: Period): Period {
  const f = jktParts(p.from);
  const t = jktParts(p.to);
  const startOfDay = (d: Date) => { const x = jktParts(d); return jktDate(x.y, x.m0, x.d).getTime() === d.getTime(); };
  if (f.d === 1 && t.d === 1 && startOfDay(p.from) && startOfDay(p.to)) {
    const months = (t.y - f.y) * 12 + (t.m0 - f.m0);
    if (months > 0) return { from: jktDate(f.y, f.m0 - months, 1), to: p.from };
  }
  const len = p.to.getTime() - p.from.getTime();
  return { from: new Date(p.from.getTime() - len), to: p.from };
}

type Row = {
  id: string;
  number: string;
  reporterId: string;
  areaId: string | null;
  category: string;
  riskLevel: string;
  status: string;
  path: string;
  createdAt: Date;
  verifiedAt: Date | null;
  verificationResult: string | null;
  decidedAt: Date | null;
  decisionResult: string | null;
  targetDate: Date | null;
  closedAt: Date | null;
  closedOnTime: boolean | null;
  isDuplicate: boolean;
  controlHierarchy: string | null;
  pointsAwarded: number;
  escalated: boolean;
  outsideArea: boolean;
  suggestion: string | null;
  suggestionApplied: boolean;
  hazardType: string | null;
  rejectReason: string | null;
  verifier: { name: string | null } | null;
  decider: { name: string | null } | null;
  area: { id: string; name: string } | null;
  reporter: { id: string; name: string | null; role: string; departemen: string | null };
};

const select = {
  id: true, number: true, reporterId: true, areaId: true, category: true, riskLevel: true, status: true, path: true, createdAt: true,
  verifiedAt: true, verificationResult: true, decidedAt: true, decisionResult: true, targetDate: true, closedAt: true, closedOnTime: true, isDuplicate: true, controlHierarchy: true,
  pointsAwarded: true, escalated: true, outsideArea: true, suggestion: true, suggestionApplied: true, hazardType: true, rejectReason: true,
  verifier: { select: { name: true } },
  decider: { select: { name: true } },
  area: { select: { id: true, name: true } },
  reporter: { select: { id: true, name: true, role: true, departemen: true } },
} as const;

function pct(n: number, d: number) {
  return d > 0 ? Math.round((n / d) * 1000) / 10 : 0;
}
function avg(xs: number[]) {
  return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0;
}

export async function computeStats(period: Period, opts: { areaId?: string | null } = {}) {
  const now = new Date();
  const endParts = jktParts(new Date(period.to.getTime() - 1));
  const trendStart = jktDate(endParts.y, endParts.m0 - 11, 1);
  const prev = previousPeriod(period);
  const earliest = new Date(Math.min(trendStart.getTime(), prev.from.getTime()));

  const [rows, activeUsers, allAreas] = await Promise.all([
    db.report.findMany({
      where: {
        ...(opts.areaId ? { areaId: opts.areaId } : {}),
        // Laporan lama tetap ikut bila ditutup, diputuskan, atau diverifikasi di dalam jendela, atau masih terbuka
        OR: [{ createdAt: { gte: earliest } }, { closedAt: { gte: earliest } }, { decidedAt: { gte: earliest } }, { verifiedAt: { gte: earliest } }, { status: { in: OPEN_STATUSES } }],
      },
      select,
    }),
    db.user.findMany({ where: { status: "ACTIVE", role: { in: ["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI"] } }, select: { id: true, name: true, role: true, areaId: true, departemen: true } }),
    db.area.findMany({ select: { id: true, name: true, active: true }, orderBy: { name: "asc" } }),
  ]);

  const inP = (d: Date | null | undefined, p: Period) => !!d && d >= p.from && d < p.to;
  const cur = rows.filter((r) => inP(r.createdAt, period));
  const prevRows = rows.filter((r) => inP(r.createdAt, prev));
  /** Valid: disetujui Manager, atau lolos verifikasi dan tidak ditolak; laporan ganda tidak pernah valid */
  const valid = (r: Row) => !r.isDuplicate && (r.decisionResult === "SETUJU" || (r.verificationResult === "VALID" && r.status !== "DITOLAK") || (r.decisionResult === "TOLAK" && r.pointsAwarded > 0));
  const rejectedAt = (r: Row) => (r.decisionResult === "TOLAK" ? r.decidedAt : r.verificationResult === "TOLAK" ? r.verifiedAt : null);
  /** Terbuka pada waktu t: sudah dibuat, belum ditutup, dan belum ditolak */
  const openAt = (r: Row, t: Date) => {
    if (r.createdAt >= t) return false;
    if (r.closedAt && r.closedAt < t) return false;
    const rej = r.status === "DITOLAK" ? rejectedAt(r) ?? r.createdAt : null;
    return !(rej && rej < t);
  };
  const isHigh = (r: Row) => r.riskLevel === "TINGGI" || r.riskLevel === "EKSTREM";
  const asOf = (p: Period) => (p.to < now ? p.to : now);

  // Partisipasi: pengguna aktif yang melapor dalam periode / pengguna aktif (pembilang dibatasi pada penyebut)
  const eligible = opts.areaId ? activeUsers.filter((u) => u.areaId === opts.areaId) : activeUsers;
  const eligibleIds = new Set(eligible.map((u) => u.id));
  const reporters = new Set(cur.map((r) => r.reporterId).filter((id) => eligibleIds.has(id)));
  const prevReporters = new Set(prevRows.map((r) => r.reporterId).filter((id) => eligibleIds.has(id)));
  const participation = pct(reporters.size, eligible.length);
  const prevParticipation = pct(prevReporters.size, eligible.length);

  // Waktu penutupan (hari) dari persetujuan hingga verifikasi penutupan, untuk laporan ditutup dalam periode
  const closedIn = (p: Period) => rows.filter((r) => inP(r.closedAt, p) && r.decidedAt && r.closedAt);
  const closedCur = closedIn(period);
  const closedPrev = closedIn(prev);
  const closureDays = avg(closedCur.map((r) => daysBetween(r.decidedAt!, r.closedAt!)));
  const prevClosureDays = avg(closedPrev.map((r) => daysBetween(r.decidedAt!, r.closedAt!)));

  // Penutupan tepat waktu = selesai sesuai target / seluruh tindak lanjut yang jatuh tempo atau ditutup dalam periode.
  // Tindak lanjut yang target-nya sudah lewat di dalam periode tetapi belum ditutup dihitung terlambat.
  const onTimeOf = (p: Period) => {
    const closed = closedIn(p).filter((r) => r.closedOnTime != null);
    const end = asOf(p);
    const lateOpen = rows.filter((r) => r.decisionResult === "SETUJU" && r.targetDate && r.targetDate >= p.from && r.targetDate < end && !(r.closedAt && r.closedAt < end) && !inP(r.closedAt, p));
    return { pct: pct(closed.filter((r) => r.closedOnTime).length, closed.length + lateOpen.length), lateOpen: lateOpen.length };
  };
  const onTimeCur = onTimeOf(period);
  const onTime = onTimeCur.pct;
  const prevOnTime = onTimeOf(prev).pct;

  // Risiko tinggi terbuka: potret pada akhir periode (atau saat ini), dibandingkan dengan awal periode
  const openAll = rows.filter((r) => OPEN_STATUSES.includes(r.status as Status));
  const highOpenNow = openAll.filter(isHigh);
  const highOpenCount = rows.filter((r) => isHigh(r) && openAt(r, asOf(period))).length;
  const highOpenPrev = rows.filter((r) => isHigh(r) && openAt(r, period.from)).length;

  // Waktu respons verifikasi (jam), dari pengiriman terakhir (termasuk revisi) hingga diverifikasi, jalur A
  const verCur = cur.filter((r) => r.path === "A" && r.verifiedAt);
  const resubmits = verCur.length
    ? await db.reportEvent.findMany({ where: { type: "REVISI_DIKIRIM", reportId: { in: verCur.map((r) => r.id) } }, select: { reportId: true, createdAt: true } })
    : [];
  const lastSubmit = (r: Row) => {
    let t = r.createdAt;
    for (const e of resubmits) if (e.reportId === r.id && e.createdAt > t && e.createdAt <= r.verifiedAt!) t = e.createdAt;
    return t;
  };
  const verifyHours = avg(verCur.map((r) => hoursBetween(lastSubmit(r), r.verifiedAt!)));
  const decCur = cur.filter((r) => r.decidedAt);
  const decideHours = avg(decCur.map((r) => hoursBetween(r.path === "A" && r.verifiedAt ? r.verifiedAt : r.createdAt, r.decidedAt!)));

  // Laporan berulang: laporan dengan area dan kategori sama yang muncul lagi (kemunculan pertama tidak dihitung)
  const keyCount = new Map<string, number>();
  for (const r of cur) {
    if (r.isDuplicate) continue;
    const k = `${r.areaId}|${r.category}`;
    keyCount.set(k, (keyCount.get(k) ?? 0) + 1);
  }
  const recurring = Array.from(keyCount.values()).reduce((s, n) => s + Math.max(0, n - 1), 0);
  const recurringPct = pct(recurring, cur.length);

  // Area yang ditampilkan: area aktif, ditambah area nonaktif yang masih memiliki data
  const usedAreaIds = new Set(rows.map((r) => r.areaId).filter(Boolean));
  const areas = allAreas.filter((a) => a.active || usedAreaIds.has(a.id)).map((a) => ({ id: a.id, name: a.active ? a.name : `${a.name} (nonaktif)` }));

  // Tren 12 bulan
  const trend: Array<{ label: string; key: string; masuk: number; ditutup: number; valid: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const p = monthPeriod(endParts.y, endParts.m0 - i);
    const mp = jktParts(p.from);
    trend.push({
      key: `${mp.y}-${String(mp.m0 + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", month: "short", year: "2-digit" }).format(p.from),
      masuk: rows.filter((r) => inP(r.createdAt, p)).length,
      ditutup: rows.filter((r) => inP(r.closedAt, p)).length,
      valid: rows.filter((r) => inP(r.createdAt, p) && valid(r)).length,
    });
  }

  const count = <T extends string>(keys: readonly T[], pick: (r: Row) => string | null) =>
    keys.map((k) => ({ key: k, count: cur.filter((r) => pick(r) === k).length }));

  const riskDist = count(RISKS, (r) => r.riskLevel);
  const categoryDist = count(CATEGORIES, (r) => r.category);
  const statusDist = count(STATUSES, (r) => r.status);
  const controlDist = count(CONTROLS, (r) => r.controlHierarchy);
  const hazardTypeDist = count(HAZARD_TYPES, (r) => r.hazardType);

  // Laporan ditolak tetap dicatat terbuka: tahap penolakan, alasan, dan siapa yang menolak
  const rejectedCur = cur.filter((r) => r.status === "DITOLAK");
  const rejectStage = (r: Row) => (r.decisionResult === "TOLAK" ? "KEPUTUSAN" : "VERIFIKASI");
  const rejectedByStage = [
    { key: "VERIFIKASI", count: rejectedCur.filter((r) => rejectStage(r) === "VERIFIKASI").length },
    { key: "KEPUTUSAN", count: rejectedCur.filter((r) => rejectStage(r) === "KEPUTUSAN").length },
  ];
  // Laporan lama tanpa alasan terstruktur dikelompokkan sebagai "Tanpa alasan"
  const rejectedByReason = [...REJECT_REASONS, "LAINNYA" as const].map((k) => ({
    key: k,
    count: rejectedCur.filter((r) => (k === "LAINNYA" ? !r.rejectReason || !(REJECT_REASONS as readonly string[]).includes(r.rejectReason) : r.rejectReason === k)).length,
  }));
  const rejectedList = rejectedCur
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((r) => ({
      id: r.id,
      number: r.number,
      area: r.area?.name ?? "-",
      category: r.category as Category,
      stage: rejectStage(r),
      reason: r.rejectReason,
      by: (rejectStage(r) === "KEPUTUSAN" ? r.decider?.name : r.verifier?.name) ?? "-",
      at: rejectedAt(r),
    }));
  const pathDist = [
    { key: "A", count: cur.filter((r) => r.path === "A").length },
    { key: "B", count: cur.filter((r) => r.path === "B").length },
  ];

  // Peta panas area x kategori
  const heatmap = areas.map((a) => ({
    area: a.name,
    areaId: a.id,
    cells: CATEGORIES.map((c) => cur.filter((r) => r.areaId === a.id && r.category === c).length),
    total: cur.filter((r) => r.areaId === a.id).length,
  }));
  const heatMax = Math.max(1, ...heatmap.flatMap((h) => h.cells));

  // Umur tindak lanjut terbuka (dari keputusan, atau dari laporan bila belum diputuskan)
  const ageOf = (r: Row) => daysBetween(r.decidedAt ?? r.createdAt, now);
  const aging = [
    { label: "0 sampai 7 hari", count: openAll.filter((r) => ageOf(r) <= 7).length },
    { label: "8 sampai 14 hari", count: openAll.filter((r) => ageOf(r) > 7 && ageOf(r) <= 14).length },
    { label: "15 sampai 30 hari", count: openAll.filter((r) => ageOf(r) > 14 && ageOf(r) <= 30).length },
    { label: "Lebih dari 30 hari", count: openAll.filter((r) => ageOf(r) > 30).length },
  ];

  // Penutupan tepat waktu per area (12 bulan)
  const closed12 = rows.filter((r) => r.closedAt && r.closedAt >= trendStart && r.closedOnTime != null);
  // Hanya area yang memiliki penutupan; area tanpa data tidak ditampilkan sebagai 0%
  const onTimeByArea = areas
    .map((a) => {
      const c = closed12.filter((r) => r.areaId === a.id);
      return { area: a.name, pct: pct(c.filter((r) => r.closedOnTime).length, c.length), n: c.length };
    })
    .filter((a) => a.n > 0)
    .sort((x, y) => y.pct - x.pct);

  // Laporan dan risiko per area
  const byArea = areas.map((a) => {
    const c = cur.filter((r) => r.areaId === a.id);
    return { area: a.name, total: c.length, tinggi: c.filter((r) => r.riskLevel === "TINGGI" || r.riskLevel === "EKSTREM").length, terbuka: openAll.filter((r) => r.areaId === a.id).length };
  });

  // Pelapor teratas (periode)
  const perUser = new Map<string, { name: string; role: string; departemen: string | null; laporan: number; valid: number; poin: number }>();
  for (const r of cur) {
    const u = perUser.get(r.reporterId) ?? { name: r.reporter.name ?? "-", role: r.reporter.role, departemen: r.reporter.departemen, laporan: 0, valid: 0, poin: 0 };
    u.laporan++;
    if (valid(r)) u.valid++;
    u.poin += r.pointsAwarded;
    perUser.set(r.reporterId, u);
  }
  const topReporters = Array.from(perUser.values()).sort((a, b) => b.poin - a.poin || b.valid - a.valid).slice(0, 10);

  // Partisipasi per peran
  const roles = ["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI"] as const;
  const participationByRole = roles.map((role) => {
    const users = eligible.filter((u) => u.role === role);
    const rep = users.filter((u) => reporters.has(u.id)).length;
    return { role, users: users.length, reporters: rep, pct: pct(rep, users.length) };
  });

  const overdueOpen = openAll.filter((r) => (r.status === "DALAM_PERBAIKAN" || r.status === "MENUNGGU_PENUTUPAN") && !!r.targetDate && r.targetDate < now).length;

  return {
    period,
    generatedAt: now,
    summary: {
      total: cur.length,
      prevTotal: prevRows.length,
      deltaTotalPct: prevRows.length ? pct(cur.length - prevRows.length, prevRows.length) : null,
      valid: cur.filter(valid).length,
      rejected: cur.filter((r) => r.status === "DITOLAK").length,
      participation,
      prevParticipation,
      activeUsers: eligible.length,
      reporters: reporters.size,
      closureDays,
      prevClosureDays,
      onTime,
      prevOnTime,
      closedInPeriod: closedCur.length,
      highOpen: highOpenCount,
      lateOpenInPeriod: onTimeCur.lateOpen,
      highOpenPrev,
      openTotal: openAll.length,
      overdueOpen,
      verifyHours,
      decideHours,
      recurringPct,
      recurring,
      escalated: cur.filter((r) => r.escalated).length,
      outsideArea: cur.filter((r) => r.outsideArea).length,
      withSuggestion: cur.filter((r) => !!r.suggestion).length,
      suggestionApplied: cur.filter((r) => r.suggestionApplied).length,
      pointsAwarded: cur.reduce((s, r) => s + r.pointsAwarded, 0),
    },
    trend,
    riskDist,
    categoryDist,
    statusDist,
    controlDist,
    hazardTypeDist,
    rejectedByStage,
    rejectedByReason,
    rejectedList,
    pathDist,
    heatmap,
    heatMax,
    aging,
    onTimeByArea,
    byArea,
    topReporters,
    participationByRole,
    highOpenList: highOpenNow.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).slice(0, 10).map((r) => ({ id: r.id, number: r.number, area: r.area?.name ?? "-", risk: r.riskLevel, status: r.status, days: Math.round(ageOf(r)), category: r.category as Category, riskLevel: r.riskLevel as Risk })),
  };
}

export type Stats = Awaited<ReturnType<typeof computeStats>>;
