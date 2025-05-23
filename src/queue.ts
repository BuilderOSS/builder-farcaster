import { PrismaClient } from '@prisma/client'
import type { JsonValue } from 'type-fest'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

/**
 * Adds a task to the queue for processing.
 * @param data - The data associated with the task.
 * @returns Resolves when the task has been successfully added to the queue.
 */
export async function addToQueue(data: JsonValue): Promise<void> {
  const taskId = uuidv4()
  const timestamp = new Date()
  const dataString = JSON.stringify(data)

  await prisma.queue.create({
    data: {
      taskId,
      data: dataString,
      timestamp,
      status: 'pending',
    },
  })
}

/**
 * Retrieves the next task from the queue.
 * @returns The next pending task, or null if no pending tasks are found.
 */
export async function getNextTask(): Promise<{
  taskId: string
  data: JsonValue
} | null> {
  const nextTask = await prisma.queue.findFirst({
    where: { status: 'pending' },
    orderBy: { timestamp: 'asc' },
  })

  if (nextTask) {
    return {
      taskId: nextTask.taskId,
      data: JSON.parse(nextTask.data) as JsonValue,
    }
  }

  return null
}

/**
 * Marks a task as completed.
 * @param taskId - The unique identifier for the task to mark as completed.
 * @returns Resolves when the task has been successfully marked as completed.
 */
export async function completeTask(taskId: string): Promise<void> {
  await prisma.queue.update({
    where: { taskId },
    data: { status: 'completed', completedAt: new Date() },
  })
}

/**
 * Retries a task if it failed.
 * @param taskId - The unique identifier for the task to retry.
 * @returns Resolves when the task has been successfully updated for retry.
 */
export async function retryTask(taskId: string): Promise<void> {
  const MAX_RETRIES = 3

  const task = await prisma.queue.findUnique({
    where: { taskId },
  })

  if (task && task.retries < MAX_RETRIES) {
    await prisma.queue.update({
      where: { taskId },
      data: { retries: task.retries + 1, status: 'pending' },
    })
  } else {
    await prisma.queue.update({
      where: { taskId },
      data: { status: 'failed' },
    })
  }
}
