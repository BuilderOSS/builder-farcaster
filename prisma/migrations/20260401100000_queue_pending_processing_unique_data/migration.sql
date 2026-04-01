-- Prevent duplicate queue payloads while tasks are pending/processing.
-- This is a Postgres partial unique index and intentionally not represented
-- directly in Prisma schema model attributes.
WITH duplicate_rows AS (
  SELECT
    "taskId",
    ROW_NUMBER() OVER (
      PARTITION BY "data"
      ORDER BY
        CASE WHEN "status" = 'processing' THEN 0 ELSE 1 END,
        "timestamp" ASC,
        "taskId" ASC
    ) AS row_num
  FROM "Queue"
  WHERE "status" IN ('pending', 'processing')
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
