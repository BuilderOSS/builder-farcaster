import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchRequest,
  HttpRequestMethod,
  runFarcasterRequestWithRetry,
} from './'

describe('farcaster request helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('returns parsed json payload for successful request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ result: { ok: true } }), { status: 200 }),
    )

    const response = await fetchRequest<{ result: { ok: boolean } }>(
      'https://api.farcaster.xyz',
      'token',
      HttpRequestMethod.GET,
      '/v2/test',
    )

    expect(response.result.ok).toBe(true)
  })

  it('throws structured error for non-2xx responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ message: 'rate limited' }] }), {
        status: 429,
        statusText: 'Too Many Requests',
      }),
    )

    await expect(
      fetchRequest(
        'https://api.farcaster.xyz',
        'token',
        HttpRequestMethod.GET,
        '/v2/test',
      ),
    ).rejects.toThrow(/429 Too Many Requests/)
  })

  it('throws when response body is non-json on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('not-json', { status: 200 }),
    )

    await expect(
      fetchRequest(
        'https://api.farcaster.xyz',
        'token',
        HttpRequestMethod.GET,
        '/v2/test',
      ),
    ).rejects.toThrow(/non-JSON response/)
  })

  it('retries retryable failures and succeeds', async () => {
    vi.useFakeTimers()
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(
        new Error('Farcaster API request failed (500 Internal Server Error)'),
      )
      .mockResolvedValueOnce('ok')

    const promise = runFarcasterRequestWithRetry(operation, 'retry-test', 2)
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toBe('ok')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('does not retry non-retryable failures', async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error('bad request'))

    await expect(
      runFarcasterRequestWithRetry(operation, 'non-retryable', 3),
    ).rejects.toThrow(/non-retryable\): bad request/)

    expect(operation).toHaveBeenCalledTimes(1)
  })
})
