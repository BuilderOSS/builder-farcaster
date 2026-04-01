-- Prevent duplicate queue payloads while tasks are pending/processing.
-- This is a Postgres partial unique index and intentionally not represented
-- directly in Prisma schema model attributes.
CREATE UNIQUE INDEX IF NOT EXISTS "queue_data_pending_processing_unique"
ON "Queue" ("data")
WHERE "status" IN ('pending', 'processing');
