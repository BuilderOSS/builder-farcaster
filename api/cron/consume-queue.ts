import { queueConsumeCommand } from '@/commands/queues/consume'
import { isAuthorizedCronRequest } from '@/services/cron/auth'

export const config = {
  runtime: 'nodejs',
}

interface ApiRequest {
  method?: string
  headers: {
    authorization?: string
  }
  query: {
    limit?: string | string[]
  }
}

interface ApiResponse {
  status: (statusCode: number) => ApiResponse
  json: (body: unknown) => void
}

/**
 * Parses the queue batch limit from request query.
 * @param input - Raw query value.
 * @returns A bounded integer limit.
 */
function parseLimit(input: string | string[] | undefined): number {
  if (!input) {
    return 10
  }

  const rawValue = Array.isArray(input) ? input[0] : input
  const parsed = Number.parseInt(rawValue, 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 10
  }

  return Math.min(parsed, 100)
}

/**
 * Executes the scheduled queue consumer job.
 * @param req - Incoming Vercel request.
 * @param res - Outgoing Vercel response.
 * @returns Promise that resolves when response is sent.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!isAuthorizedCronRequest(req.headers.authorization)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const startedAt = Date.now()
  const limit = parseLimit(req.query.limit)

  try {
    await queueConsumeCommand(limit)
    res.status(200).json({
      ok: true,
      job: 'consume-queue',
      limit,
      durationMs: Date.now() - startedAt,
    })
    return
  } catch (error) {
    res.status(500).json({
      ok: false,
      job: 'consume-queue',
      limit,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    })
    return
  }
}
