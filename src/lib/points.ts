import { db } from "./db";
import type { AppSettings } from "./constants";

export async function pointBalance(userId: string) {
  const agg = await db.pointLedger.aggregate({ where: { userId }, _sum: { points: true } });
  return agg._sum.points ?? 0;
}

export async function pointEarned(userId: string) {
  const agg = await db.pointLedger.aggregate({ where: { userId, points: { gt: 0 } }, _sum: { points: true } });
  return agg._sum.points ?? 0;
}

export function levelFor(earned: number, levels: AppSettings["levels"]) {
  if (earned >= levels.emas) return { name: "Emas", next: null as number | null, color: "#c9a227" };
  if (earned >= levels.perak) return { name: "Perak", next: levels.emas, color: "#8a9199" };
  return { name: "Perunggu", next: levels.perak, color: "#b87333" };
}

function isoWeekKey(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${week}`;
}

/**
 * Memberikan poin dasar saat laporan dinyatakan valid.
 * Dipanggil sekali per laporan (idempoten lewat pointsAwarded > 0).
 */
export async function awardValidationPoints(reportId: string, settings: AppSettings) {
  const report = await db.report.findUnique({ where: { id: reportId }, include: { reporter: true } });
  if (!report || report.pointsAwarded > 0) return 0;
  if (!settings.eligibleRoles.includes(report.reporter.role as AppSettings["eligibleRoles"][number])) return 0;
  const entries: Array<{ type: string; points: number; note: string }> = [];
  const isNearMiss = report.category === "NYARIS_CELAKA";
  entries.push({ type: isNearMiss ? "NYARIS_CELAKA" : "LAPORAN_VALID", points: isNearMiss ? settings.points.nearMiss : settings.points.valid, note: report.number });
  if (report.riskLevel === "TINGGI" || report.riskLevel === "EKSTREM") {
    entries.push({ type: "BONUS_RISIKO", points: settings.points.highRiskBonus, note: report.number });
  }

  // Bonus konsisten: laporan valid pada empat minggu ISO berturut-turut
  const since = new Date(Date.now() - 35 * 86400000);
  const recent = await db.report.findMany({
    where: { reporterId: report.reporterId, pointsAwarded: { gt: 0 }, createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const weeks = new Set(recent.map((r) => isoWeekKey(r.createdAt)));
  weeks.add(isoWeekKey(report.createdAt));
  const thisWeek = isoWeekKey(new Date());
  let consecutive = 0;
  for (let i = 0; i < 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() - 7 * i);
    if (weeks.has(isoWeekKey(d))) consecutive++;
    else break;
  }
  if (consecutive >= 4) {
    const already = await db.pointLedger.findFirst({ where: { userId: report.reporterId, type: "BONUS_KONSISTEN", createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } });
    if (!already) entries.push({ type: "BONUS_KONSISTEN", points: settings.points.streakBonus, note: `Konsisten empat minggu (${thisWeek})` });
  }

  const total = entries.reduce((s, e) => s + e.points, 0);
  await db.$transaction([
    db.pointLedger.createMany({ data: entries.map((e) => ({ ...e, userId: report.reporterId, reportId: report.id })) }),
    db.report.update({ where: { id: report.id }, data: { pointsAwarded: total } }),
  ]);
  return total;
}

export async function awardSuggestionBonus(reportId: string, settings: AppSettings) {
  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report || !report.suggestion) return 0;
  const exists = await db.pointLedger.findFirst({ where: { reportId, type: "BONUS_USULAN" } });
  if (exists) return 0;
  await db.$transaction([
    db.pointLedger.create({ data: { userId: report.reporterId, reportId, type: "BONUS_USULAN", points: settings.points.suggestionBonus, note: report.number } }),
    db.report.update({ where: { id: reportId }, data: { pointsAwarded: { increment: settings.points.suggestionBonus }, suggestionApplied: true } }),
  ]);
  return settings.points.suggestionBonus;
}

/** Membatalkan poin bila laporan ternyata ganda atau tidak benar */
export async function revokePoints(reportId: string, reason: string) {
  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report || report.pointsAwarded <= 0) return;
  await db.$transaction([
    db.pointLedger.create({ data: { userId: report.reporterId, reportId, type: "PEMBATALAN", points: -report.pointsAwarded, note: `${report.number}: ${reason}` } }),
    db.report.update({ where: { id: reportId }, data: { pointsAwarded: 0 } }),
  ]);
}
