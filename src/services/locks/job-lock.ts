import { prisma } from '@/db'

/**
 * Attempts to acquire a named job lock with TTL.
 * @param name - Lock name.
 * @param owner - Owner identifier for diagnostics.
 * @param ttlMs - Lock duration in milliseconds.
 * @returns True when lock is acquired.
 */
export async function acquireJobLock(
  name: string,
  owner: string,
  ttlMs: number,
): Promise<boolean> {
  const lockedUntil = new Date(Date.now() + ttlMs)

  const rows = await prisma.$queryRaw<{ name: string }[]>`
    INSERT INTO "JobLock" ("name", "lockedUntil", "owner", "createdAt", "updatedAt")
    VALUES (${name}, ${lockedUntil}, ${owner}, NOW(), NOW())
    ON CONFLICT ("name") DO UPDATE
      SET "lockedUntil" = EXCLUDED."lockedUntil",
          "owner" = EXCLUDED."owner",
          "updatedAt" = NOW()
      WHERE "JobLock"."lockedUntil" <= NOW()
    RETURNING "name"
  `

  return rows.length > 0
}

/**
 * Releases a named lock for a specific owner.
 * @param name - Lock name.
 * @param owner - Owner identifier.
 */
export async function releaseJobLock(
  name: string,
  owner: string,
): Promise<void> {
  await prisma.jobLock.updateMany({
    where: {
      name,
      owner,
    },
    data: {
      lockedUntil: new Date(),
    },
  })
}
