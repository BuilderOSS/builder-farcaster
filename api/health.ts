import { prisma } from '@/db'

/**
 * Parses a non-negative integer environment variable with fallback.
 * @param name - Environment variable name.
 * @param fallback - Default value when unset/invalid.
 * @returns Parsed non-negative integer.
 */
function parseNonNegativeIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) {
    return fallback
  }

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback
  }

  return parsed
}

const PENDING_WARNING_THRESHOLD = parseNonNegativeIntEnv(
  'PENDING_WARNING_THRESHOLD',
  500,
)
const PENDING_AGE_WARNING_MINUTES = parseNonNegativeIntEnv(
  'PENDING_AGE_WARNING_MINUTES',
  30,
)
const PROCESSING_STALE_WARNING_MINUTES = parseNonNegativeIntEnv(
  'PROCESSING_STALE_WARNING_MINUTES',
  20,
)

export const config = {
  runtime: 'nodejs',
}

interface ApiRequest {
  method?: string
}

interface ApiResponse {
  status: (statusCode: number) => ApiResponse
  json: (body: unknown) => void
}

/**
 * Returns runtime health and queue depth metrics.
 * @param req - Incoming Vercel request.
 * @param res - Outgoing Vercel response.
 * @returns Promise that resolves when response is sent.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const [
      pending,
      processing,
      failed,
      completedLast24h,
      oldestPendingTask,
      oldestProcessingTask,
    ] = await Promise.all([
      prisma.queue.count({ where: { status: 'pending' } }),
      prisma.queue.count({ where: { status: 'processing' } }),
      prisma.queue.count({ where: { status: 'failed' } }),
      prisma.queue.count({
        where: {
          status: 'completed',
          completedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.queue.findFirst({
        where: { status: 'pending' },
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true },
      }),
      prisma.queue.findFirst({
        where: { status: 'processing' },
        orderBy: { lockedAt: 'asc' },
        select: { lockedAt: true },
      }),
    ])

    const now = Date.now()
    const oldestPendingAt = oldestPendingTask?.timestamp
    const oldestProcessingAt = oldestProcessingTask?.lockedAt
    const oldestPendingAgeMinutes = oldestPendingAt
      ? Math.floor((now - oldestPendingAt.getTime()) / (60 * 1000))
      : null
    const oldestProcessingAgeMinutes = oldestProcessingAt
      ? Math.floor((now - oldestProcessingAt.getTime()) / (60 * 1000))
      : null

    const warnings: string[] = []
    if (pending > PENDING_WARNING_THRESHOLD) {
      warnings.push(
        `pending queue depth is high (${pending.toString()} > ${PENDING_WARNING_THRESHOLD.toString()})`,
      )
    }

    if (
      oldestPendingAgeMinutes !== null &&
      oldestPendingAgeMinutes > PENDING_AGE_WARNING_MINUTES
    ) {
      warnings.push(
        `oldest pending task age is high (${oldestPendingAgeMinutes.toString()}m > ${PENDING_AGE_WARNING_MINUTES.toString()}m)`,
      )
    }

    if (
      oldestProcessingAgeMinutes !== null &&
      oldestProcessingAgeMinutes > PROCESSING_STALE_WARNING_MINUTES
    ) {
      warnings.push(
        `oldest processing task age is high (${oldestProcessingAgeMinutes.toString()}m > ${PROCESSING_STALE_WARNING_MINUTES.toString()}m)`,
      )
    }

    res.status(200).json({
      ok: true,
      service: 'builder-farcaster',
      now: new Date().toISOString(),
      warnings,
      queue: {
        pending,
        processing,
        failed,
        completedLast24h,
        oldestPendingAt: oldestPendingAt?.toISOString() ?? null,
        oldestPendingAgeMinutes,
        oldestProcessingAgeMinutes,
        oldestProcessingLockedAt: oldestProcessingAt?.toISOString() ?? null,
      },
    })
    return
  } catch (error) {
    res.status(500).json({
      ok: false,
      service: 'builder-farcaster',
      error: error instanceof Error ? error.message : String(error),
    })
    return
  }
}
