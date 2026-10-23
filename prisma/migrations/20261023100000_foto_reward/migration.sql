-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "imageAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RewardImage" (
    "rewardId" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardImage_pkey" PRIMARY KEY ("rewardId")
);

-- AddForeignKey
ALTER TABLE "RewardImage" ADD CONSTRAINT "RewardImage_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

