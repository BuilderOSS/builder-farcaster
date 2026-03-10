-- CreateTable
CREATE TABLE "Queue" (
    "taskId" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3)
);
