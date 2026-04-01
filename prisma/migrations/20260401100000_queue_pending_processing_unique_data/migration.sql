-- Prevent duplicate queue payloads while tasks are pending/processing.
-- This is a Postgres partial unique index and intentionally not represented
-- directly in Prisma schema model attributes.
-- Deduplicate only pending rows to avoid touching in-flight processing locks
-- during migrations on live systems.
WITH duplicate_rows AS (
  SELECT
    "taskId",
    ROW_NUMBER() OVER (
      PARTITION BY "data"
      ORDER BY "timestamp" ASC, "taskId" ASC
  ) AS row_num
  FROM "Queue"
  WHERE "status" = 'pending'
)
DELETE FROM "Queue"
WHERE "taskId" IN (
  SELECT "taskId"
  FROM duplicate_rows
  WHERE row_num > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "queue_data_pending_processing_unique"
ON "Queue" ("data")
WHERE "status" IN ('pending', 'processing');
