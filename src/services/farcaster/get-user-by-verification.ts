import { getFarcasterAuthToken } from '@/services/farcaster/auth'
import { fetchRequest, HttpRequestMethod } from '@/services/farcaster/index'
import { EnvWithAppKeys, User } from '@/services/farcaster/types'

interface Result {
  user: User
}

interface Response {
  result: Result
}

export const getUserByVerification = async (
  env: EnvWithAppKeys,
  address: string,
): Promise<Result> => {
  const { FARCASTER_API_BASE_URL: baseUrl } = env
  const authToken = await getFarcasterAuthToken(env)

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
