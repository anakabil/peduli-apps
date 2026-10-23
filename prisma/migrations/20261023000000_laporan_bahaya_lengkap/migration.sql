-- Laporan bahaya: jenis bahaya, dampak, usulan penanggung jawab, dan alasan penolakan
ALTER TABLE "Report" ADD COLUMN     "hazardType" TEXT,
ADD COLUMN     "impact" TEXT,
ADD COLUMN     "proposedPicId" TEXT,
ADD COLUMN     "rejectReason" TEXT;
ALTER TABLE "Report" ADD CONSTRAINT "Report_proposedPicId_fkey" FOREIGN KEY ("proposedPicId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
