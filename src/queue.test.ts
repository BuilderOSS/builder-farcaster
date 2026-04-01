import { addToQueue, completeTask, retryTask } from '@/queue'
import { Prisma } from '@prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface QueueTaskRow {
  maxRetries: number
  retries: number
  taskId: string
}

const prismaMock = vi.hoisted(() => ({
  queue: {
    create: vi.fn<() => Promise<unknown>>(),
    findFirst: vi.fn<() => Promise<QueueTaskRow | null>>(),
    updateMany: vi.fn<() => Promise<{ count: number }>>(),
  },
}))

vi.mock('@/db', () => ({
  prisma: prismaMock,
}))

describe('queue helpers', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('completes task only when worker lock matches', async () => {
    prismaMock.queue.updateMany.mockResolvedValue({ count: 1 })

    await expect(completeTask('task-1', 'worker-1')).resolves.toBe(true)
    const [callArg] = prismaMock.queue.updateMany.mock.calls[0] as [
      {
        where: {
          lockedBy: string
          status: string
          taskId: string
        }
      },
    ]

    expect(callArg.where).toMatchObject({
      lockedBy: 'worker-1',
      status: 'processing',
      taskId: 'task-1',
    })
  })

  it('returns false when retryTask cannot find worker-owned processing row', async () => {
    prismaMock.queue.findFirst.mockResolvedValue(null)

    await expect(retryTask('task-1', 'worker-1', 'reason')).resolves.toBe(false)
  })

  it('requeues task while below max retries', async () => {
    prismaMock.queue.findFirst.mockResolvedValue({
      maxRetries: 3,
      retries: 0,
      taskId: 'task-1',
    })
    prismaMock.queue.updateMany.mockResolvedValue({ count: 1 })

    await expect(retryTask('task-1', 'worker-1', 'reason')).resolves.toBe(true)
    const [callArg] = prismaMock.queue.updateMany.mock.calls[0] as [
      {
        data: {
          status: string
        }
      },
    ]

    expect(callArg.data.status).toBe('pending')
  })

  it('marks task failed when retry count reaches max', async () => {
    prismaMock.queue.findFirst.mockResolvedValue({
      maxRetries: 1,
      retries: 0,
      taskId: 'task-1',
    })
    prismaMock.queue.updateMany.mockResolvedValue({ count: 1 })

    await expect(retryTask('task-1', 'worker-1', 'reason')).resolves.toBe(true)
    const [callArg] = prismaMock.queue.updateMany.mock.calls[0] as [
      {
        data: {
          status: string
        }
      },
    ]

    expect(callArg.data.status).toBe('failed')
  })

  it('swallows unique-constraint errors in addToQueue', async () => {
    prismaMock.queue.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        clientVersion: '5.22.0',
        code: 'P2002',
      }),
    )

    await expect(addToQueue({ hello: 'world' })).resolves.toBeUndefined()
  })
})
