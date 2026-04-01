import { logger } from '@/logger'
import {
  fetchRequest,
  HttpRequestMethod,
  runFarcasterRequestWithRetry,
} from '@/services/farcaster/index'
import { Env, Verification } from '@/services/farcaster/types'
import { NonNegative } from 'type-fest'

const MAX_PAGES = 100

interface Result {
  verifications: Verification[]
}

interface Response {
  result: Result
  next?: {
    cursor: string
  }
}

export const getVerifications = async (
  env: Env,
  fid: number,
  cursor?: string,
  limit: NonNegative<number> = 50,
): Promise<Result> => {
  const { FARCASTER_API_BASE_URL: baseUrl, FARCASTER_API_KEY: apiKey } = env
  let currentCursor = cursor ?? ''
  let response: Response
  const verifications: Verification[] = []
  let pageCount = 0

  do {
    if (pageCount >= MAX_PAGES) {
      logger.warn(
        { fid, maxPages: MAX_PAGES },
        'Reached verification pagination limit, stopping early.',
      )
      break
    }

    response = await runFarcasterRequestWithRetry(
      async () =>
        fetchRequest<Response>(
          baseUrl,
          apiKey,
          HttpRequestMethod.GET,
          '/v2/verifications',
          {
            params: {
              fid: fid.toString(),
              cursor: currentCursor,
              limit: limit.toString(),
            },
          },
        ),
      `get-verifications fid=${fid.toString()} cursor=${currentCursor || 'start'}`,
    )

    verifications.push(...response.result.verifications)
    currentCursor = response.next?.cursor ?? ''
    pageCount += 1
  } while (response.next)

  return {
    verifications,
  }
}
