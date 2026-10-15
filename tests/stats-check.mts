import { computeStats, currentMonthPeriod, previousPeriod } from "../src/lib/stats.ts";
import { db } from "../src/lib/db.ts";
const p = currentMonthPeriod();
const s = await computeStats(p);
const prev = previousPeriod(p);
const sql = await db.$queryRawUnsafe<Array<Record<string, number>>>(`
  SELECT
    (SELECT count(*)::int FROM "Report" WHERE "createdAt" >= $1 AND "createdAt" < $2) AS total,
    (SELECT count(*)::int FROM "Report" WHERE "createdAt" >= $3 AND "createdAt" < $4) AS prev_total,
    (SELECT count(*)::int FROM "Report" WHERE "createdAt" >= $1 AND "createdAt" < $2 AND status = 'DITOLAK') AS rejected,
    (SELECT count(*)::int FROM "Report" WHERE status IN ('MENUNGGU_VERIFIKASI','PERLU_REVISI','MENUNGGU_KEPUTUSAN','DALAM_PERBAIKAN','MENUNGGU_PENUTUPAN') AND "riskLevel" IN ('TINGGI','EKSTREM')) AS high_open,
    (SELECT count(*)::int FROM "Report" WHERE "closedAt" >= $1 AND "closedAt" < $2) AS closed_in_period`, p.from, p.to, prev.from, prev.to);
const fmt = (d: Date) => new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }).format(d);
console.log("Periode:", fmt(p.from), "s.d.", fmt(p.to), "| pembanding:", fmt(prev.from), "s.d.", fmt(prev.to));
const pairs: Array<[string, number, number]> = [
  ["Laporan masuk", s.summary.total, sql[0].total],
  ["Laporan masuk periode lalu", s.summary.prevTotal, sql[0].prev_total],
  ["Ditolak", s.summary.rejected, sql[0].rejected],
  ["Risiko tinggi terbuka", s.summary.highOpen, sql[0].high_open],
  ["Ditutup dalam periode", s.summary.closedInPeriod, sql[0].closed_in_period],
];
for (const [k, a, b] of pairs) console.log(`${a === b ? "OK  " : "BEDA"} ${k}: aplikasi ${a}, SQL ${b}`);
console.log("Partisipasi", s.summary.participation, "% | tepat waktu", s.summary.onTime, "% | berulang", s.summary.recurringPct, "%");
await db.$disconnect();
