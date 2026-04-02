import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './health.js'

const { isAuthorizedCronRequestMock } = vi.hoisted(() => ({
  isAuthorizedCronRequestMock: vi.fn(),
}))

const prismaMock = vi.hoisted(() => ({
  queue: {
    count: vi.fn(),
    findFirst: vi.fn(),
  },
}))

vi.mock('../src/config', () => ({
  env: {
    PENDING_AGE_WARNING_MINUTES: 30,
    PENDING_WARNING_THRESHOLD: 500,
    PROCESSING_STALE_WARNING_MINUTES: 20,
  },
}))

vi.mock('../src/services/cron/auth', () => ({
  isAuthorizedCronRequest: isAuthorizedCronRequestMock,
}))

vi.mock('../src/db', () => ({
  prisma: prismaMock,
}))

/**
 * Creates a minimal mock response object for API handler tests.
 * @returns Mock response and captured payload.
 */
function createRes() {
  const payload: { body?: unknown; code?: number } = {}
  const res = {
    json: vi.fn((body: unknown) => {
      payload.body = body
    }),
    status: vi.fn((code: number) => {
      payload.code = code
      return res
    }),
  }

  return { payload, res }
}

describe('health api', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns minimal public payload without cron auth', async () => {
    isAuthorizedCronRequestMock.mockReturnValue(false)
    const { payload, res } = createRes()

    await handler({ headers: {}, method: 'GET' }, res)

    expect(payload.code).toBe(200)
    expect(payload.body).toMatchObject({
      ok: true,
      service: 'builder-farcaster',
      visibility: 'public',
    })
  })

  it('returns detailed queue metrics with cron auth', async () => {
    isAuthorizedCronRequestMock.mockReturnValue(true)
    const oldestPending = new Date(Date.now() - 31 * 60 * 1000)
    const oldestProcessing = new Date(Date.now() - 21 * 60 * 1000)

    prismaMock.queue.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(7)
    prismaMock.queue.findFirst
      .mockResolvedValueOnce({
        timestamp: oldestPending,
      })
      .mockResolvedValueOnce({
        lockedAt: oldestProcessing,
      })
    const { payload, res } = createRes()

    await handler(
      { headers: { authorization: 'Bearer x' }, method: 'GET' },
      res,
    )

    expect(payload.code).toBe(200)
    expect(payload.body).toMatchObject({
      ok: true,
      queue: {
        completedLast24h: 7,
        failed: 1,
        oldestPendingAgeMinutes: 31,
        oldestPendingAt: oldestPending.toISOString(),
        oldestProcessingAgeMinutes: 21,
        oldestProcessingLockedAt: oldestProcessing.toISOString(),
        pending: 10,
        processing: 2,
      },
      warnings: [
        'oldest pending task age is high (31m > 30m)',
        'oldest processing task age is high (21m > 20m)',
      ],
    })
  })
})
