import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getFollowers } from './get-followers'

const { fetchRequestMock, runFarcasterRequestWithRetryMock } = vi.hoisted(
  () => ({
    fetchRequestMock: vi.fn(),
    runFarcasterRequestWithRetryMock:
      vi.fn<(operation: () => Promise<unknown>) => Promise<unknown>>(),
  }),
)

vi.mock('./index', () => ({
  fetchRequest: fetchRequestMock,
  HttpRequestMethod: { GET: 'GET' },
  runFarcasterRequestWithRetry: runFarcasterRequestWithRetryMock,
}))

describe('getFollowers', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    runFarcasterRequestWithRetryMock.mockImplementation(async (operation) =>
      operation(),
    )
  })

  it('uses api key and paginates followers', async () => {
    fetchRequestMock
      .mockResolvedValueOnce({
        next: { cursor: 'next-cursor' },
        result: { users: [{ fid: 1 }] },
      })
      .mockResolvedValueOnce({
        result: { users: [{ fid: 2 }] },
      })

    const result = await getFollowers(
      {
        FARCASTER_API_BASE_URL: 'https://api.farcaster.xyz',
        FARCASTER_API_KEY: 'key',
        FARCASTER_APP_FID: '1',
      },
      863865,
    )

    expect(fetchRequestMock).toHaveBeenNthCalledWith(
      1,
      'https://api.farcaster.xyz',
      'key',
      'GET',
      '/v2/followers',
      expect.any(Object),
    )
    expect(result.users).toEqual([{ fid: 1 }, { fid: 2 }])
  })
})
