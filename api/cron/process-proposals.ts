import { randomUUID } from 'node:crypto'
import { processProposalsCommand } from '../../src/commands/process/proposals'
import { isAuthorizedCronRequest } from '../../src/services/cron/auth'
import {
  acquireJobLock,
  releaseJobLock,
} from '../../src/services/locks/job-lock'
import {
  getTargetingOptionsFromEnv,
  getTargetingOptionsFromQuery,
  mergeTargetingOptions,
} from '../../src/services/testing/targeting'

const LOCK_NAME = 'process-proposals'
const LOCK_TTL_MS = 50 * 60 * 1000

export const config = {
  runtime: 'nodejs',
}

interface ApiRequest {
  method?: string
  headers: {
    authorization?: string
  }
  query: {
    fid?: string | string[]
    daoId?: string | string[]
    chain?: string | string[]
    dryRun?: string | string[]
  }
}

interface ApiResponse {
  status: (statusCode: number) => ApiResponse
  json: (body: unknown) => void
}

/**
 * Executes the scheduled proposal processing job.
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
  const options = mergeTargetingOptions(
    getTargetingOptionsFromEnv(),
    getTargetingOptionsFromQuery(req.query),
  )
  const owner = `cron-${LOCK_NAME}-${randomUUID()}`

  const lockAcquired = await acquireJobLock(LOCK_NAME, owner, LOCK_TTL_MS)
  if (!lockAcquired) {
    res.status(200).json({
      ok: true,
      job: 'process-proposals',
      skipped: true,
      reason: 'Job lock is already held by another run',
      durationMs: Date.now() - startedAt,
    })
    return
  }

  try {
    await processProposalsCommand(options)
    res.status(200).json({
      ok: true,
      job: 'process-proposals',
      options,
      durationMs: Date.now() - startedAt,
    })
    return
  } catch (error) {
    res.status(500).json({
      ok: false,
      job: 'process-proposals',
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    })
    return
  } finally {
    await releaseJobLock(LOCK_NAME, owner)
  }
}
