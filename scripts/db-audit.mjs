/*
 * Pemeriksa invarian basis data PEDULI Apps (hanya membaca, tidak mengubah data).
 * Jalankan: node scripts/db-audit.mjs   (memakai DIRECT_URL / DATABASE_URL / POSTGRES_URL dari lingkungan atau .env)
 * Keluar dengan kode 1 bila ada pelanggaran.
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

for (const file of [".env.local", ".env"]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = ["DIRECT_URL", "DATABASE_URL", "POSTGRES_URL", "PRISMA_DATABASE_URL"].map((n) => process.env[n]).find((u) => u && u.trim());
if (!url) {
  console.error("Tidak ada URL basis data.");
  process.exit(2);
}
const db = new PrismaClient({ datasourceUrl: url });

const CHECKS = [
  ["Nomor laporan ganda", `SELECT number AS ref, count(*)::int AS n FROM "Report" GROUP BY number HAVING count(*) > 1`],
  ["Pencacah nomor di bawah urutan terpakai", `SELECT 'report:' || substr(number, 5, 6) AS ref, max(substr(number, 12)::int) AS n FROM "Report" r GROUP BY 1 HAVING max(substr(number, 12)::int) > coalesce((SELECT value FROM "Counter" c WHERE c.key = 'report:' || substr(max(r.number), 5, 6)), 0)`],
  ["Laporan tanpa event DIBUAT", `SELECT r.number AS ref FROM "Report" r WHERE NOT EXISTS (SELECT 1 FROM "ReportEvent" e WHERE e."reportId" = r.id AND e.type = 'DIBUAT')`],
  ["Status akhir event tidak sama dengan status laporan", `SELECT r.number AS ref, r.status, e."toStatus" FROM "Report" r JOIN LATERAL (SELECT "toStatus" FROM "ReportEvent" WHERE "reportId" = r.id AND "toStatus" IS NOT NULL AND type NOT IN ('PENGINGAT','AUDIT','DIESKALASI') ORDER BY "createdAt" DESC, id DESC LIMIT 1) e ON true WHERE e."toStatus" <> r.status`],
  ["Laporan tanpa foto", `SELECT r.number AS ref FROM "Report" r WHERE NOT EXISTS (SELECT 1 FROM "Photo" p WHERE p."reportId" = r.id AND p.kind = 'LAPORAN')`],
  ["Ukuran foto tidak sesuai isi", `SELECT id AS ref FROM "Photo" WHERE size <> octet_length(data)`],
  ["Jalur tidak sesuai peran pelapor saat ini (informasi)", `SELECT r.number AS ref, r.path, u.role FROM "Report" r JOIN "User" u ON u.id = r."reporterId" WHERE (r.path = 'A') <> (u.role = 'PENGAWAS') LIMIT 0`],
  ["Jalur B memiliki hasil verifikasi", `SELECT number AS ref FROM "Report" WHERE path = 'B' AND ("verificationResult" IS NOT NULL OR "verifiedAt" IS NOT NULL)`],
  ["Jalur B berstatus menunggu verifikasi atau revisi", `SELECT number AS ref, status FROM "Report" WHERE path = 'B' AND status IN ('MENUNGGU_VERIFIKASI','PERLU_REVISI')`],
  ["Jalur A melewati verifikasi tanpa hasil VALID", `SELECT number AS ref, status FROM "Report" WHERE path = 'A' AND status IN ('MENUNGGU_KEPUTUSAN','DALAM_PERBAIKAN','MENUNGGU_PENUTUPAN','SELESAI') AND ("verificationResult" IS DISTINCT FROM 'VALID' OR "verifiedAt" IS NULL)`],
  ["PERLU_REVISI tanpa hasil REVISI", `SELECT number AS ref FROM "Report" WHERE status = 'PERLU_REVISI' AND "verificationResult" IS DISTINCT FROM 'REVISI'`],
  ["Perbaikan/penutupan tanpa keputusan SETUJU lengkap", `SELECT number AS ref, status FROM "Report" WHERE status IN ('DALAM_PERBAIKAN','MENUNGGU_PENUTUPAN','SELESAI') AND ("decisionResult" IS DISTINCT FROM 'SETUJU' OR "decidedAt" IS NULL OR "targetDate" IS NULL OR "controlHierarchy" IS NULL OR coalesce("picName", "picId") IS NULL)`],
  ["Menunggu penutupan tanpa completedAt", `SELECT number AS ref FROM "Report" WHERE status IN ('MENUNGGU_PENUTUPAN','SELESAI') AND "completedAt" IS NULL`],
  ["SELESAI tanpa closedAt/closerId", `SELECT number AS ref FROM "Report" WHERE status = 'SELESAI' AND ("closedAt" IS NULL OR "closerId" IS NULL)`],
  ["closedOnTime tidak sesuai completedAt dan target", `SELECT number AS ref FROM "Report" WHERE status = 'SELESAI' AND "targetDate" IS NOT NULL AND "closedOnTime" IS DISTINCT FROM ("completedAt" <= "targetDate")`],
  ["Ditutup sebelum keputusan atau penyelesaian", `SELECT number AS ref FROM "Report" WHERE ("closedAt" < "decidedAt") OR ("completedAt" < "decidedAt") OR ("closedAt" < "completedAt") OR ("decidedAt" < "createdAt") OR ("verifiedAt" < "createdAt")`],
  ["Laporan ganda masih memegang poin", `SELECT number AS ref, "pointsAwarded" AS n FROM "Report" WHERE "isDuplicate" AND "pointsAwarded" <> 0`],
  ["pointsAwarded berbeda dengan buku poin laporan", `SELECT r.number AS ref, r."pointsAwarded" AS stored, coalesce(sum(l.points),0)::int AS ledger FROM "Report" r LEFT JOIN "PointLedger" l ON l."reportId" = r.id GROUP BY r.id HAVING r."pointsAwarded" <> coalesce(sum(l.points),0)`],
  ["suggestionApplied tanpa BONUS_USULAN padahal pelapor berhak", `SELECT r.number AS ref FROM "Report" r WHERE r."suggestionApplied" AND r."pointsAwarded" > 0 AND NOT EXISTS (SELECT 1 FROM "PointLedger" l WHERE l."reportId" = r.id AND l.type = 'BONUS_USULAN')`],
  ["BONUS_USULAN ganda per laporan", `SELECT "reportId" AS ref, count(*)::int AS n FROM "PointLedger" WHERE type = 'BONUS_USULAN' GROUP BY "reportId" HAVING count(*) > 1`],
  ["BONUS_KONSISTEN ganda per minggu", `SELECT "userId" || ' ' || note AS ref, count(*)::int AS n FROM "PointLedger" WHERE type = 'BONUS_KONSISTEN' GROUP BY "userId", note HAVING count(*) > 1`],
  ["Saldo poin negatif", `SELECT "userId" AS ref, sum(points)::int AS n FROM "PointLedger" GROUP BY "userId" HAVING sum(points) < 0`],
  ["Penukaran tanpa entri PENUKARAN sepadan", `SELECT r.id AS ref FROM "Redemption" r WHERE NOT EXISTS (SELECT 1 FROM "PointLedger" l WHERE l."userId" = r."userId" AND l.type = 'PENUKARAN' AND l.points = -r."pointsCost")`],
  ["Stok reward negatif", `SELECT name AS ref, stock AS n FROM "Reward" WHERE stock < 0`],
  ["Pengawas aktif dengan atasan bukan Superintendent aktif", `SELECT u.email AS ref FROM "User" u LEFT JOIN "User" a ON a.id = u."atasanId" WHERE u.status = 'ACTIVE' AND u.role = 'PENGAWAS' AND u."atasanId" IS NOT NULL AND (a.role <> 'SUPERINTENDENT' OR a.status <> 'ACTIVE')`],
  ["Manager area bukan Manager aktif", `SELECT ar.code AS ref FROM "Area" ar JOIN "User" u ON u.id = ar."managerId" WHERE u.role <> 'MANAGER' OR u.status <> 'ACTIVE'`],
  ["Email tidak dalam huruf kecil", `SELECT email AS ref FROM "User" WHERE email <> lower(email)`],
  ["NIK ganda (tanpa memperhatikan huruf)", `SELECT upper(nik) AS ref, count(*)::int AS n FROM "User" WHERE nik IS NOT NULL GROUP BY upper(nik) HAVING count(*) > 1`],
  ["Siklus atasan", `WITH RECURSIVE ch(start, cur, depth) AS (SELECT id, "atasanId", 1 FROM "User" WHERE "atasanId" IS NOT NULL UNION ALL SELECT ch.start, u."atasanId", ch.depth + 1 FROM ch JOIN "User" u ON u.id = ch.cur WHERE ch.cur IS NOT NULL AND ch.depth < 20) SELECT DISTINCT start AS ref FROM ch WHERE cur = start`],
  ["clientId ganda per laporan (tidak boleh terjadi)", `SELECT "clientId" AS ref, count(*)::int AS n FROM "Report" WHERE "clientId" IS NOT NULL GROUP BY "clientId" HAVING count(*) > 1`],
];

let violations = 0;
for (const [name, sql] of CHECKS) {
  if (/LIMIT 0/.test(sql)) continue;
  let rows;
  try {
    rows = await db.$queryRawUnsafe(sql);
  } catch (e) {
    violations++;
    console.log(`GALAT ${name}: ${String(e.message).split("\n").filter(Boolean).pop()}`);
    continue;
  }
  const ok = rows.length === 0;
  if (!ok) violations++;
  console.log(`${ok ? "OK  " : "GAGAL"} ${name}${ok ? "" : `: ${rows.length} baris, contoh ${JSON.stringify(rows.slice(0, 3))}`}`);
}
await db.$disconnect();
console.log(violations ? `\n${violations} invarian dilanggar.` : "\nSeluruh invarian terpenuhi.");
process.exit(violations ? 1 : 0);
