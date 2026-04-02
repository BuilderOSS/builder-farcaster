import { getFarcasterAuthToken } from './auth'
import { fetchRequest, HttpRequestMethod } from './index'
import { Env, User } from './types'

interface Result {
  user: User
}

interface Response {
  result: Result
}

/**
 * Fetches the authenticated Farcaster app user profile.
 * Exported for future admin/debug tooling and authenticated route diagnostics.
 * @param env - Runtime environment with Farcaster credentials.
 * @returns Current authenticated user payload.
 */
export const getMe = async (env: Env): Promise<Result> => {
  const { FARCASTER_API_BASE_URL: baseUrl } = env
  const authToken = await getFarcasterAuthToken(env)

  const { result } = await fetchRequest<Response>(
    baseUrl,
    authToken,
    HttpRequestMethod.GET,
    '/v2/me',
    {},
  )

  return result
}
