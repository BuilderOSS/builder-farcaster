import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getVerifications } from './get-verifications'

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

describe('getVerifications', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    runFarcasterRequestWithRetryMock.mockImplementation(async (operation) =>
      operation(),
    )
  })

  it('uses api key and paginates verification responses', async () => {
    fetchRequestMock
      .mockResolvedValueOnce({
        next: { cursor: 'c1' },
        result: { verifications: [{ address: '0x1' }] },
      })
      .mockResolvedValueOnce({
        result: { verifications: [{ address: '0x2' }] },
      })

    const result = await getVerifications(
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
      '/v2/verifications',
      expect.any(Object),
    )
    expect(result.verifications).toEqual([
      { address: '0x1' },
      { address: '0x2' },
    ])
  })
})
