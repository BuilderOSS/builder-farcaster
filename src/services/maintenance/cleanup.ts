import { prisma } from '@/db'

const CACHE_RETENTION_DAYS = 3
const COMPLETED_QUEUE_RETENTION_DAYS = 30
const FAILED_QUEUE_RETENTION_DAYS = 60

export interface CleanupResult {
  deletedExpiredCache: number
  deletedCompletedTasks: number
  deletedFailedTasks: number
}

/**
 * Removes expired cache records and old queue tasks.
 * @returns Deleted row counts for each cleanup category.
 */
export async function cleanupDatabase(): Promise<CleanupResult> {
  const now = Date.now()

  const cacheCutoff = new Date(now - CACHE_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const completedQueueCutoff = new Date(
    now - COMPLETED_QUEUE_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  )
  const failedQueueCutoff = new Date(
    now - FAILED_QUEUE_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  )

  const [expiredCacheResult, completedQueueResult, failedQueueResult] =
    await prisma.$transaction([
      prisma.cache.deleteMany({
        where: {
          timestamp: {
            lt: cacheCutoff,
          },
        },
      }),
      prisma.queue.deleteMany({
        where: {
          status: 'completed',
          completedAt: {
            not: null,
            lt: completedQueueCutoff,
          },
        },
      }),
      prisma.queue.deleteMany({
        where: {
          status: 'failed',
          updatedAt: {
            lt: failedQueueCutoff,
          },
        },
      }),
    ])

  return {
    deletedExpiredCache: expiredCacheResult.count,
    deletedCompletedTasks: completedQueueResult.count,
    deletedFailedTasks: failedQueueResult.count,
  }
}
