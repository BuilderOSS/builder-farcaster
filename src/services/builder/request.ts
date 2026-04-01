const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504])

/**
 * Extracts HTTP status code from a GraphQL request error.
 * @param error - Unknown thrown value.
 * @returns HTTP status code when available.
 */
function getStatusCode(error: unknown): number | undefined {
  if (!(error instanceof Error)) {
    return undefined
  }

  const response = (error as Error & { response?: { status?: number } })
    .response
  return response?.status
}

/**
 * Reads retry-after delay from response headers.
 * @param error - Unknown thrown value.
 * @returns Retry delay in milliseconds when available.
 */
function getRetryAfterMs(error: unknown): number | undefined {
  if (!(error instanceof Error)) {
    return undefined
  }

  const response = (
    error as Error & {
      response?: { headers?: Headers | Record<string, string> }
    }
  ).response
  const headers = response?.headers
  if (!headers) {
    return undefined
  }

  const retryAfterRaw =
    headers instanceof Headers
      ? headers.get('retry-after')
      : (headers['retry-after'] ?? headers['Retry-After'])

  if (!retryAfterRaw) {
    return undefined
  }

  const retryAfterSeconds = Number.parseInt(retryAfterRaw, 10)
  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0) {
    return undefined
  }

  return retryAfterSeconds * 1000
}

/**
 * Sleeps for a given duration.
 * @param ms - Duration in milliseconds.
 * @returns Promise that resolves after delay.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Executes a request with retry/backoff for transient GraphQL failures.
 * @param operation - Request operation to execute.
 * @param context - Text label used in retry logs.
 * @param maxAttempts - Maximum number of attempts.
 * @returns Successful operation result.
 */
export async function runBuilderRequestWithRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxAttempts = 4,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      const statusCode = getStatusCode(error)
      const isRetryable =
        statusCode !== undefined && RETRYABLE_STATUS_CODES.has(statusCode)
      const isLastAttempt = attempt === maxAttempts

      if (!isRetryable || isLastAttempt) {
        throw error
      }

      const retryAfterMs = getRetryAfterMs(error)
      const backoffMs = 1000 * 2 ** (attempt - 1)
      const jitterMs = Math.floor(Math.random() * 250)
      const waitMs = retryAfterMs ?? backoffMs + jitterMs

      console.warn(
        `[builder-retry] ${context} failed with status ${String(statusCode)}; retrying in ${String(waitMs)}ms (attempt ${String(attempt + 1)}/${String(maxAttempts)})`,
      )

      await delay(waitMs)
    }
  }

  throw new Error(`Unexpected retry flow exit for ${context}`)
}
