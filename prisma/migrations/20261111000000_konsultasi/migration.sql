-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "askerId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DIAJUKAN',
    "screenerId" TEXT,
    "screenedAt" TIMESTAMP(3),
    "screenNote" TEXT,
    "rejectReason" TEXT,
    "rejectNote" TEXT,
    "assigneeId" TEXT,
    "answer" TEXT,
    "answeredAt" TIMESTAMP(3),
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Consultation_status_createdAt_idx" ON "Consultation"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Consultation_askerId_idx" ON "Consultation"("askerId");

-- CreateIndex
CREATE INDEX "Consultation_assigneeId_status_idx" ON "Consultation"("assigneeId", "status");

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_askerId_fkey" FOREIGN KEY ("askerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_screenerId_fkey" FOREIGN KEY ("screenerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

