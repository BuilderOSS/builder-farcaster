import { prisma } from '@/db'

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
    const [pending, processing, failed, completedLast24h, oldestPendingTask] =
      await Promise.all([
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
      ])

    res.status(200).json({
      ok: true,
      service: 'builder-farcaster',
      now: new Date().toISOString(),
      queue: {
        pending,
        processing,
        failed,
        completedLast24h,
        oldestPendingAt: oldestPendingTask?.timestamp.toISOString() ?? null,
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
