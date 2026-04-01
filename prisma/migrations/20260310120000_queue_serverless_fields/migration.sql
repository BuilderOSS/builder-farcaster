-- AlterTable
ALTER TABLE "Queue"
ADD COLUMN "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "lastError" TEXT,
ADD COLUMN "lockedAt" TIMESTAMP(3),
ADD COLUMN "lockedBy" TEXT,
ADD COLUMN "maxRetries" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Queue_status_availableAt_timestamp_idx"
ON "Queue"("status", "availableAt", "timestamp");
