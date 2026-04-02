import { isAuthorizedCronRequest } from '../../src/services/cron/auth.js'
import { cleanupDatabase } from '../../src/services/maintenance/cleanup.js'

export const config = {
  runtime: 'nodejs',
}

interface ApiRequest {
  method?: string
  headers: {
    authorization?: string
  }
}

interface ApiResponse {
  status: (statusCode: number) => ApiResponse
  json: (body: unknown) => void
}

/**
 * Executes scheduled database cleanup.
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

  try {
    const result = await cleanupDatabase()

    res.status(200).json({
      ok: true,
      job: 'cleanup',
      ...result,
      durationMs: Date.now() - startedAt,
    })
    return
  } catch (error) {
    res.status(500).json({
      ok: false,
      job: 'cleanup',
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    })
    return
  }
}
