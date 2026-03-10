import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { Env, User } from '@/services/warpcast/types'

interface Result {
  user: User
}

interface Response {
  result: Result
}

/**
 * Fetches a Farcaster user by username.
 * @param env - Environment containing Warpcast/Farcaster API base URL.
 * @param username - Username to resolve.
 * @returns The matching user.
 */
export const getUserByUsername = async (
  env: Env,
  username: string,
): Promise<Result> => {
  const { WARPCAST_BASE_URL: baseUrl } = env

  const { result } = await fetchRequest<Response>(
    baseUrl,
    undefined,
    HttpRequestMethod.GET,
    '/v2/user-by-username',
    {
      params: { username },
    },
  )

  return result
}
