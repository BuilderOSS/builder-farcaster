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
 */
export default function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!isAuthorizedCronRequest(req.headers.authorization)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  // TODO(invites): Re-enable this cron after app-key auth has been validated
  // end-to-end for /v2/user-by-verification and invitation queue consumption.
  // Remaining work before re-enable:
  // 1) Verify app-key bearer token format against authenticated Farcaster endpoints.
  // 2) Add integration test coverage for invite owner->fid resolution.
  // 3) Run dry-run + no-send + real-send invite validation and confirm retries.
  res.status(503).json({
    ok: false,
    job: 'process-invites',
    skipped: true,
    reason:
      'Invites are intentionally disabled pending app-key auth validation.',
  })
}
