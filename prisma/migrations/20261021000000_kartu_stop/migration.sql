-- Kartu STOP (DuPont): daftar periksa, aktivitas, tindakan aman, dorongan, perbaikan segera
-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "activities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "immediateAction" TEXT,
ADD COLUMN     "safeActs" TEXT,
ADD COLUMN     "safeEncourage" TEXT,
ADD COLUMN     "stopItems" TEXT[] DEFAULT ARRAY[]::TEXT[];

