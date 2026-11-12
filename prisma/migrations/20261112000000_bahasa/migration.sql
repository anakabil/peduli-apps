-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "bodyEn" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lang" TEXT NOT NULL DEFAULT 'id';

