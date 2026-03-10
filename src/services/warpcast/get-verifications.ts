import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { Env, Verification } from '@/services/warpcast/types'
import { NonNegative } from 'type-fest'

interface Result {
  verifications: Verification[]
}

interface Response {
  result: Result
}

export const getVerifications = async (
  env: Env,
  fid: number,
  cursor?: string,
  limit: NonNegative<number> = 25,
): Promise<Result> => {
  const { WARPCAST_BASE_URL: baseUrl } = env

  const { result } = await fetchRequest<Response>(
    baseUrl,
    undefined,
    HttpRequestMethod.GET,
    '/v2/verifications',
    {
      params: {
        fid: fid.toString(),
        cursor: cursor ?? '',
        limit: limit.toString(),
      },
    },
  )

  return result
}
