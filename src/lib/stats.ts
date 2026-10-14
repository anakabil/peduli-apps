import { db } from "./db";
import { CATEGORIES, RISKS, STATUSES, OPEN_STATUSES, CONTROLS, type Category, type Risk, type Status } from "./constants";
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

export function previousPeriod(p: Period): Period {
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
  controlHierarchy: string | null;
  pointsAwarded: number;
  escalated: boolean;
  outsideArea: boolean;
  suggestion: string | null;
  suggestionApplied: boolean;
  area: { id: string; name: string } | null;
  reporter: { id: string; name: string | null; role: string; departemen: string | null };
};

const select = {
  id: true, number: true, reporterId: true, areaId: true, category: true, riskLevel: true, status: true, path: true, createdAt: true,
  verifiedAt: true, verificationResult: true, decidedAt: true, decisionResult: true, targetDate: true, closedAt: true, closedOnTime: true, controlHierarchy: true,
  pointsAwarded: true, escalated: true, outsideArea: true, suggestion: true, suggestionApplied: true,
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

  const [rows, activeUsers, areas] = await Promise.all([
    db.report.findMany({
      where: { ...(opts.areaId ? { areaId: opts.areaId } : {}), OR: [{ createdAt: { gte: earliest } }, { status: { in: OPEN_STATUSES } }] },
      select,
    }),
    db.user.findMany({ where: { status: "ACTIVE", role: { in: ["PENGAWAS", "SUPERINTENDENT", "MANAGER", "DIREKSI"] } }, select: { id: true, name: true, role: true, areaId: true, departemen: true } }),
    db.area.findMany({ where: { active: true }, select: { id: true, name: true } }),
  ]);

  const inP = (d: Date | null | undefined, p: Period) => !!d && d >= p.from && d < p.to;
  const cur = rows.filter((r) => inP(r.createdAt, period));
  const prevRows = rows.filter((r) => inP(r.createdAt, prev));
  const valid = (r: Row) => r.verificationResult === "VALID" || r.decisionResult === "SETUJU" || r.pointsAwarded > 0;

  // Partisipasi: pengguna yang melapor dalam periode / pengguna aktif
  const eligible = opts.areaId ? activeUsers.filter((u) => u.areaId === opts.areaId) : activeUsers;
  const reporters = new Set(cur.map((r) => r.reporterId));
  const prevReporters = new Set(prevRows.map((r) => r.reporterId));
  const participation = pct(reporters.size, eligible.length);
  const prevParticipation = pct(prevReporters.size, eligible.length);

  // Waktu penutupan (hari) untuk laporan ditutup dalam periode
  const closedCur = rows.filter((r) => inP(r.closedAt, period) && r.decidedAt && r.closedAt);
  const closedPrev = rows.filter((r) => inP(r.closedAt, prev) && r.decidedAt && r.closedAt);
  const closureDays = avg(closedCur.map((r) => daysBetween(r.decidedAt!, r.closedAt!)));
  const prevClosureDays = avg(closedPrev.map((r) => daysBetween(r.decidedAt!, r.closedAt!)));

  // Penutupan tepat waktu
  const onTime = pct(closedCur.filter((r) => r.closedOnTime).length, closedCur.filter((r) => r.closedOnTime != null).length);
  const prevOnTime = pct(closedPrev.filter((r) => r.closedOnTime).length, closedPrev.filter((r) => r.closedOnTime != null).length);

  // Risiko tinggi masih terbuka (seluruh waktu)
  const openAll = rows.filter((r) => OPEN_STATUSES.includes(r.status as Status));
  const highOpen = openAll.filter((r) => r.riskLevel === "TINGGI" || r.riskLevel === "EKSTREM");
  const highOpenPrev = rows.filter((r) => (r.riskLevel === "TINGGI" || r.riskLevel === "EKSTREM") && r.createdAt < period.from && (!r.closedAt || r.closedAt >= period.from) && r.status !== "DITOLAK").length;

  // Waktu respons verifikasi (jam) jalur A
  const verCur = cur.filter((r) => r.path === "A" && r.verifiedAt);
  const verifyHours = avg(verCur.map((r) => hoursBetween(r.createdAt, r.verifiedAt!)));
  const decCur = cur.filter((r) => r.decidedAt);
  const decideHours = avg(decCur.map((r) => hoursBetween(r.verifiedAt ?? r.createdAt, r.decidedAt!)));

  // Laporan berulang: lokasi (area) dan kategori sama
  const keyCount = new Map<string, number>();
  for (const r of cur) {
    const k = `${r.areaId}|${r.category}`;
    keyCount.set(k, (keyCount.get(k) ?? 0) + 1);
  }
  const recurring = cur.filter((r) => (keyCount.get(`${r.areaId}|${r.category}`) ?? 0) > 1).length;
  const recurringPct = pct(recurring, cur.length);

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
  const onTimeByArea = areas
    .map((a) => {
      const c = closed12.filter((r) => r.areaId === a.id);
      return { area: a.name, pct: pct(c.filter((r) => r.closedOnTime).length, c.length), n: c.length };
    })
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

  const overdueOpen = openAll.filter((r) => {
    if (r.status === "DALAM_PERBAIKAN" || r.status === "MENUNGGU_PENUTUPAN") return r.targetDate && r.targetDate < now;
    return false;
  }).length;

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
      highOpen: highOpen.length,
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
    pathDist,
    heatmap,
    heatMax,
    aging,
    onTimeByArea,
    byArea,
    topReporters,
    participationByRole,
    highOpenList: highOpen.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).slice(0, 10).map((r) => ({ id: r.id, number: r.number, area: r.area?.name ?? "-", risk: r.riskLevel, status: r.status, days: Math.round(ageOf(r)), category: r.category as Category, riskLevel: r.riskLevel as Risk })),
  };
}

export type Stats = Awaited<ReturnType<typeof computeStats>>;
