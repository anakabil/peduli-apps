-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "clientId" TEXT;

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PointLedger_userId_type_idx" ON "PointLedger"("userId", "type");

-- Isi ulang clientId dari kunci idempoten lama (ReportEvent.meta pada event DIBUAT); satu laporan per kunci
-- Kunci dibatasi per pelapor: "<reporterId>:<clientId>"
UPDATE "Report" r SET "clientId" = e.k
FROM (
  SELECT DISTINCT ON (rp."reporterId" || ':' || ev.meta) rp."reporterId" || ':' || ev.meta AS k, ev."reportId"
  FROM "ReportEvent" ev
  JOIN "Report" rp ON rp.id = ev."reportId"
  WHERE ev.type = 'DIBUAT' AND ev.meta IS NOT NULL AND ev.meta <> ''
  ORDER BY rp."reporterId" || ':' || ev.meta, ev."createdAt"
) e
WHERE e."reportId" = r.id;

-- CreateIndex
CREATE UNIQUE INDEX "Report_clientId_key" ON "Report"("clientId");

