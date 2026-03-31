import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { Env, User } from '@/services/warpcast/types'

interface Result {
  users: User[]
}

interface Response {
  result: {
    users: User[]
  }
  next?: {
    cursor: string
  }
}

/**
 * Retrieves all followers of a user.
 * @param env - The environment variables containing access token and base URL.
 * @param fid - The ID of the user for whom to retrieve followers.
 * @returns - A promise that resolves to an object containing all retrieved users.
 */
export const getFollowers = async (env: Env, fid: number): Promise<Result> => {
  const { FARCASTER_API_BASE_URL: baseUrl } = env
  let newCursor = ''
  let users: User[] = []
  let response: Response

  do {
    const params = {
      fid: fid.toString(),
      cursor: newCursor,
      limit: '50',
    }
    response = await fetchRequest<Response>(
      baseUrl,
      undefined,
      HttpRequestMethod.GET,
      '/v2/followers',
      {
        params,
      },
    )
    users = [...users, ...response.result.users]
    newCursor = response.next ? response.next.cursor : ''
  } while (response.next)

  return { users }
}
