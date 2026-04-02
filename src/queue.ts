import { Prisma } from '@prisma/client'
import type { JsonValue } from 'type-fest'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from './db.js'

const DEFAULT_MAX_RETRIES = 3

export interface QueueTask {
  taskId: string
  data: JsonValue
}

/**
 * Adds a task to the queue for processing.
 * @param data - The data associated with the task.
 * @returns Resolves when the task has been successfully added to the queue.
 */
export async function addToQueue(data: JsonValue): Promise<void> {
  const taskId = uuidv4()
  const timestamp = new Date()
  const dataString = JSON.stringify(data)

  try {
    await prisma.queue.create({
      data: {
        taskId,
        data: dataString,
        timestamp,
        status: 'pending',
        availableAt: timestamp,
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return
    }

    throw error
  }
}

/**
 * Claims up to `limit` tasks atomically for a worker.
 * @param limit - Maximum number of tasks to claim.
 * @param workerId - A unique identifier for the current worker.
 * @returns The claimed tasks with parsed JSON payload.
 */
export async function claimPendingTasks(
  limit: number,
  workerId: string,
): Promise<QueueTask[]> {
  const now = new Date()

  return prisma.$transaction(async (tx) => {
    const candidates = await tx.queue.findMany({
      where: {
        status: 'pending',
        availableAt: {
          lte: now,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
      take: limit,
      select: {
        taskId: true,
      },
    })

    if (candidates.length === 0) {
      return []
    }

    const taskIds = candidates.map((task) => task.taskId)

    await tx.queue.updateMany({
      where: {
        taskId: {
          in: taskIds,
        },
        status: 'pending',
      },
      data: {
        status: 'processing',
        lockedAt: now,
        lockedBy: workerId,
      },
    })

    const claimedTasks = await tx.queue.findMany({
      where: {
        taskId: {
          in: taskIds,
        },
        status: 'processing',
        lockedBy: workerId,
      },
      orderBy: {
        timestamp: 'asc',
      },
      select: {
        taskId: true,
        data: true,
      },
    })

    return claimedTasks.map((task) => ({
      taskId: task.taskId,
      data: JSON.parse(task.data) as JsonValue,
    }))
  })
}

/**
 * Marks a task as completed.
 * @param taskId - The unique identifier for the task to mark as completed.
 * @param workerId - Worker currently holding the task lock.
 * @returns True when the task transition is applied.
 */
export async function completeTask(
  taskId: string,
  workerId: string,
): Promise<boolean> {
  const result = await prisma.queue.updateMany({
    where: {
      taskId,
      status: 'processing',
      lockedBy: workerId,
    },
    data: {
      status: 'completed',
      completedAt: new Date(),
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    },
  })

  return result.count > 0
}

/**
 * Retries a task if it failed.
 * @param taskId - The unique identifier for the task to retry.
 * @param workerId - Worker currently holding the task lock.
 * @param reason - Optional error reason for diagnostics.
 * @returns True when the task transition is applied.
 */
export async function retryTask(
  taskId: string,
  workerId: string,
  reason?: string,
): Promise<boolean> {
  const task = await prisma.queue.findFirst({
    where: {
      taskId,
      status: 'processing',
      lockedBy: workerId,
    },
  })

  if (!task) {
    return false
  }

  const parsedMaxRetries = task.maxRetries
  const maxRetries = Number.isFinite(parsedMaxRetries)
    ? parsedMaxRetries
    : DEFAULT_MAX_RETRIES
  const nextRetryCount = task.retries + 1

  if (nextRetryCount >= maxRetries) {
    const result = await prisma.queue.updateMany({
      where: {
        taskId,
        status: 'processing',
        lockedBy: workerId,
      },
      data: {
        retries: nextRetryCount,
        status: 'failed',
        lastError: reason?.slice(0, 2000),
        lockedAt: null,
        lockedBy: null,
      },
    })

    return result.count > 0
  }

  const retryDelaySeconds = Math.min(2 ** nextRetryCount * 30, 3600)
  const availableAt = new Date(Date.now() + retryDelaySeconds * 1000)

  const result = await prisma.queue.updateMany({
    where: {
      taskId,
      status: 'processing',
      lockedBy: workerId,
    },
    data: {
      retries: nextRetryCount,
      status: 'pending',
      availableAt,
      lastError: reason?.slice(0, 2000),
      lockedAt: null,
      lockedBy: null,
    },
  })

  return result.count > 0
}
