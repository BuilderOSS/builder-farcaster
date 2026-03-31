import { getWarpcastAuthToken } from '@/services/warpcast/auth'
import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { Env, User } from '@/services/warpcast/types'

interface Result {
  user: User
}

interface Response {
  result: Result
}

export const getUserByVerification = async (
  env: Env,
  address: string,
): Promise<Result> => {
  const { FARCASTER_API_BASE_URL: baseUrl } = env
  const authToken = await getWarpcastAuthToken(env)

  const { result } = await fetchRequest<Response>(
    baseUrl,
    authToken,
    HttpRequestMethod.GET,
    '/v2/user-by-verification',
    {
      params: { address },
    },
  )

  return result
}
