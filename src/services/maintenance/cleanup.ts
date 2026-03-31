import { prisma } from '@/db'

const CACHE_RETENTION_DAYS = 3
const COMPLETED_QUEUE_RETENTION_DAYS = 30
const FAILED_QUEUE_RETENTION_DAYS = 60
const STALE_PROCESSING_MINUTES = 15

export interface CleanupResult {
  deletedExpiredCache: number
  deletedCompletedTasks: number
  deletedFailedTasks: number
  recoveredStaleProcessingTasks: number
  failedStaleProcessingTasks: number
}

/**
 * Removes expired cache records and old queue tasks.
 * @returns Deleted row counts for each cleanup category.
 */
export async function cleanupDatabase(): Promise<CleanupResult> {
  const now = Date.now()
  const processingCutoff = new Date(now - STALE_PROCESSING_MINUTES * 60 * 1000)

  const cacheCutoff = new Date(now - CACHE_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const completedQueueCutoff = new Date(
    now - COMPLETED_QUEUE_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  )
  const failedQueueCutoff = new Date(
    now - FAILED_QUEUE_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  )

  const staleProcessingTasks = await prisma.queue.findMany({
    where: {
      status: 'processing',
      lockedAt: {
        lt: processingCutoff,
      },
    },
    select: {
      maxRetries: true,
      retries: true,
      taskId: true,
    },
  })

  let recoveredStaleProcessingTasks = 0
  let failedStaleProcessingTasks = 0

  for (const task of staleProcessingTasks) {
    const nextRetryCount = task.retries + 1

    if (nextRetryCount >= task.maxRetries) {
      await prisma.queue.update({
        where: {
          taskId: task.taskId,
        },
        data: {
          lastError:
            'Task recovered from stale processing lock and failed after max retries.',
          lockedAt: null,
          lockedBy: null,
          retries: nextRetryCount,
          status: 'failed',
        },
      })
      failedStaleProcessingTasks += 1
      continue
    }

    await prisma.queue.update({
      where: {
        taskId: task.taskId,
      },
      data: {
        availableAt: new Date(now),
        lastError:
          'Task recovered from stale processing lock and re-queued for retry.',
        lockedAt: null,
        lockedBy: null,
        retries: nextRetryCount,
        status: 'pending',
      },
    })
    recoveredStaleProcessingTasks += 1
  }

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
    recoveredStaleProcessingTasks,
    failedStaleProcessingTasks,
  }
}
