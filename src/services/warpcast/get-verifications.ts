import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { Env, Verification } from '@/services/warpcast/types'
import { NonNegative } from 'type-fest'

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
  const { FARCASTER_API_BASE_URL: baseUrl } = env
  let currentCursor = cursor ?? ''
  let response: Response
  let verifications: Verification[] = []

  do {
    response = await fetchRequest<Response>(
      baseUrl,
      undefined,
      HttpRequestMethod.GET,
      '/v2/verifications',
      {
        params: {
          fid: fid.toString(),
          cursor: currentCursor,
          limit: limit.toString(),
        },
      },
    )

    verifications = [...verifications, ...response.result.verifications]
    currentCursor = response.next?.cursor ?? ''
  } while (response.next)

  return {
    verifications,
  }
}
