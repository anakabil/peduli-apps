import { db } from "./db";
import { Prisma } from "@prisma/client";
import { jktParts, jktDate } from "./format";
import type { AppSettings, Role } from "./constants";

type Tx = Prisma.TransactionClient;

/** Jenis entri yang dihitung sebagai poin "diperoleh" (dasar level dan peringkat) */
export const EARN_TYPES = ["LAPORAN_VALID", "NYARIS_CELAKA", "BONUS_RISIKO", "BONUS_USULAN", "BONUS_KONSISTEN"] as const;
/** Pembatalan mengurangi poin diperoleh; penukaran dan pengembaliannya tidak memengaruhi level */
export const EARN_LEDGER_FILTER: Prisma.PointLedgerWhereInput = { type: { in: [...EARN_TYPES, "PEMBATALAN"] } };

export function isEligible(role: string, settings: AppSettings) {
  return settings.eligibleRoles.includes(role as Role);
}

export async function pointBalance(userId: string, client: Tx | typeof db = db) {
  const agg = await client.pointLedger.aggregate({ where: { userId }, _sum: { points: true } });
  return agg._sum.points ?? 0;
}

/** Poin diperoleh dari laporan (bersih setelah pembatalan); dasar level */
export async function pointEarned(userId: string) {
  const agg = await db.pointLedger.aggregate({ where: { userId, ...EARN_LEDGER_FILTER }, _sum: { points: true } });
  return Math.max(0, agg._sum.points ?? 0);
}

export function levelFor(earned: number, levels: AppSettings["levels"]) {
  if (earned >= levels.emas) return { name: "Emas", next: null as number | null, color: "#c9a227" };
  if (earned >= levels.perak) return { name: "Perak", next: levels.emas, color: "#8a9199" };
  return { name: "Perunggu", next: levels.perak, color: "#b87333" };
}

/** Kunci minggu ISO menurut kalender WIB */
export function isoWeekKey(d: Date) {
  const p = jktParts(d);
  const date = new Date(Date.UTC(p.y, p.m0, p.d));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Mengunci baris pengguna dalam transaksi agar operasi saldo per pengguna berurutan */
export async function lockUser(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
}

/**
 * Memberikan poin dasar saat laporan dinyatakan valid. Harus dipanggil di dalam transaksi
 * yang sama dengan transisi status. Idempoten lewat klaim pointsAwarded = 0.
 */
export async function awardValidationPoints(tx: Tx, reportId: string, settings: AppSettings) {
  const report = await tx.report.findUnique({ where: { id: reportId }, include: { reporter: { select: { role: true } } } });
  if (!report || report.pointsAwarded > 0 || report.isDuplicate) return 0;
  if (!isEligible(report.reporter.role, settings)) return 0;

  const entries: Array<{ type: string; points: number; note: string }> = [];
  const isNearMiss = report.category === "NYARIS_CELAKA";
  entries.push({ type: isNearMiss ? "NYARIS_CELAKA" : "LAPORAN_VALID", points: isNearMiss ? settings.points.nearMiss : settings.points.valid, note: report.number });
  if (report.riskLevel === "TINGGI" || report.riskLevel === "EKSTREM") {
    entries.push({ type: "BONUS_RISIKO", points: settings.points.highRiskBonus, note: report.number });
  }
  const positive = entries.filter((e) => e.points > 0);
  const total = positive.reduce((s, e) => s + e.points, 0);
  if (total <= 0) return 0;

  // Klaim atomik: hanya satu proses yang berhasil mengubah pointsAwarded dari 0
  const claim = await tx.report.updateMany({ where: { id: report.id, pointsAwarded: 0 }, data: { pointsAwarded: total } });
  if (claim.count !== 1) return 0;
  await tx.pointLedger.createMany({ data: positive.map((e) => ({ ...e, userId: report.reporterId, reportId: report.id })) });

  const streak = await awardStreakBonus(tx, report.reporterId, report.createdAt, settings);
  return total + streak;
}

/**
 * Bonus konsisten: laporan valid pada empat minggu ISO (WIB) berturut-turut yang berakhir
 * di minggu laporan ini dibuat. Paling banyak satu bonus per minggu kalender.
 */
async function awardStreakBonus(tx: Tx, userId: string, reportCreatedAt: Date, settings: AppSettings) {
  if (settings.points.streakBonus <= 0) return 0;
  await lockUser(tx, userId);
  const weekKey = isoWeekKey(reportCreatedAt);
  const marker = `Konsisten empat minggu (${weekKey})`;
  const already = await tx.pointLedger.findFirst({ where: { userId, type: "BONUS_KONSISTEN", note: marker } });
  if (already) return 0;
  const p = jktParts(reportCreatedAt);
  const since = jktDate(p.y, p.m0, p.d - 35);
  const valid = await tx.report.findMany({
    where: { reporterId: userId, pointsAwarded: { gt: 0 }, isDuplicate: false, createdAt: { gte: since, lte: reportCreatedAt } },
    select: { createdAt: true },
  });
  const weeks = new Set(valid.map((r) => isoWeekKey(r.createdAt)));
  for (let i = 0; i < 4; i++) {
    if (!weeks.has(isoWeekKey(new Date(reportCreatedAt.getTime() - i * 7 * 86400000)))) return 0;
  }
  await tx.pointLedger.create({ data: { userId, type: "BONUS_KONSISTEN", points: settings.points.streakBonus, note: marker } });
  return settings.points.streakBonus;
}

/** Bonus usulan perbaikan yang diterapkan; hanya untuk peran yang berhak poin */
export async function awardSuggestionBonus(tx: Tx, reportId: string, settings: AppSettings) {
  const report = await tx.report.findUnique({ where: { id: reportId }, include: { reporter: { select: { role: true } } } });
  if (!report || !report.suggestion || report.isDuplicate) return 0;
  if (!isEligible(report.reporter.role, settings) || settings.points.suggestionBonus <= 0) {
    await tx.report.updateMany({ where: { id: reportId, suggestionApplied: false }, data: { suggestionApplied: true } });
    return 0;
  }
  const claim = await tx.report.updateMany({ where: { id: reportId, suggestionApplied: false }, data: { pointsAwarded: { increment: settings.points.suggestionBonus }, suggestionApplied: true } });
  if (claim.count !== 1) return 0;
  await tx.pointLedger.create({ data: { userId: report.reporterId, reportId, type: "BONUS_USULAN", points: settings.points.suggestionBonus, note: report.number } });
  return settings.points.suggestionBonus;
}

/** Membatalkan seluruh poin laporan bila laporan ternyata ganda atau tidak benar */
export async function revokePoints(tx: Tx, reportId: string, reason: string) {
  const report = await tx.report.findUnique({ where: { id: reportId } });
  if (!report || report.pointsAwarded <= 0) return 0;
  const claim = await tx.report.updateMany({ where: { id: reportId, pointsAwarded: report.pointsAwarded }, data: { pointsAwarded: 0 } });
  if (claim.count !== 1) return 0;
  await tx.pointLedger.create({ data: { userId: report.reporterId, reportId, type: "PEMBATALAN", points: -report.pointsAwarded, note: `${report.number}: ${reason}` } });
  return report.pointsAwarded;
}
