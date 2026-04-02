import { randomUUID } from 'node:crypto'
import { processUpdates } from '../../src/commands/process/propdates.js'
import { isAuthorizedCronRequest } from '../../src/services/cron/auth.js'
import {
  acquireJobLock,
  releaseJobLock,
} from '../../src/services/locks/job-lock.js'
import {
  getTargetingOptionsFromEnv,
  getTargetingOptionsFromQuery,
  mergeTargetingOptions,
} from '../../src/services/testing/targeting.js'

const LOCK_NAME = 'process-propdates'
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
 * Executes the scheduled proposal update processing job.
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
      job: 'process-propdates',
      skipped: true,
      reason: 'Job lock is already held by another run',
      durationMs: Date.now() - startedAt,
    })
    return
  }

  try {
    await processUpdates(options)
    res.status(200).json({
      ok: true,
      job: 'process-propdates',
      options,
      durationMs: Date.now() - startedAt,
    })
    return
  } catch (error) {
    res.status(500).json({
      ok: false,
      job: 'process-propdates',
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    })
    return
  } finally {
    await releaseJobLock(LOCK_NAME, owner)
  }
}
