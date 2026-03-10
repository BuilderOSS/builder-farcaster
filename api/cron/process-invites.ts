import { processInvitesCommand } from '@/commands/process/invites'
import { isAuthorizedCronRequest } from '@/services/cron/auth'

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
 * Executes the scheduled invitation processing job.
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
    await processInvitesCommand()
    res.status(200).json({
      ok: true,
      job: 'process-invites',
      durationMs: Date.now() - startedAt,
    })
    return
  } catch (error) {
    res.status(500).json({
      ok: false,
      job: 'process-invites',
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    })
    return
  }
}
