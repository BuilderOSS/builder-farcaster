export enum HttpRequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export interface FetchOptions {
  params?: Record<string, string>
  json?: Record<string, unknown>
  headers?: Record<string, string>
  timeoutMs?: number
}

export interface FetchResponse {
  errors?: { message: string }[]

  [key: string]: unknown
}

/**
 * Returns the first API error message when available.
 * @param data - Parsed API response payload.
 * @returns First error message or undefined.
 */
function getFirstApiErrorMessage(data: FetchResponse): string | undefined {
  const firstError = data.errors?.[0]
  return firstError?.message
}

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000
const DEFAULT_RETRY_ATTEMPTS = 3
const BASE_RETRY_DELAY_MS = 300

/**
 * Returns whether an error is retryable for Farcaster API requests.
 * @param error - Unknown thrown error.
 * @returns True when retry should be attempted.
 */
function isRetryableFarcasterError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  if (error.name === 'AbortError') {
    return true
  }

  if (
    error.message.includes('fetch failed') ||
    error.message.includes('network') ||
    error.message.includes('timed out')
  ) {
    return true
  }

  const statusMatch = /\((\d{3})\s/.exec(error.message)
  const statusCode = statusMatch ? Number(statusMatch[1]) : undefined

  if (!statusCode) {
    return false
  }

  return statusCode === 429 || statusCode >= 500
}

/**
 * Delays execution for a specified number of milliseconds.
 * @param ms - Delay duration.
 */
async function wait(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

/**
 * Executes a Farcaster request with bounded retry/backoff.
 * @param operation - Request operation callback.
 * @param context - Context string for error diagnostics.
 * @param maxAttempts - Maximum retry attempts.
 * @returns Operation result.
 */
export async function runFarcasterRequestWithRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxAttempts = DEFAULT_RETRY_ATTEMPTS,
): Promise<T> {
  let attempt = 0
  let lastError: unknown

  while (attempt < maxAttempts) {
    attempt += 1

    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (!isRetryableFarcasterError(error) || attempt >= maxAttempts) {
        break
      }

      const jitter = Math.floor(Math.random() * 150)
      const delayMs = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1) + jitter
      await wait(delayMs)
    }
  }

  if (lastError instanceof Error) {
    throw new Error(
      `Farcaster request failed (${context}): ${lastError.message}`,
    )
  }

  throw new Error(`Farcaster request failed (${context}): unknown error`)
}

/**
 * Performs a HTTP request to the specified path using the provided method and options.
 * @param baseUrl - The base URL to prepend to the path.
 * @param authToken - The auth token to include in the request headers.
 * @param method - The HTTP method to use for the request.
 * @param path - The path to append to the base URL for the request.
 * @param [options] - Additional options for the request.
 * @returns - A promise that resolves with the response data.
 */
export async function fetchRequest<T>(
  baseUrl: string,
  authToken: string | undefined,
  method: HttpRequestMethod,
  path: string,
  options?: FetchOptions,
): Promise<T> {
  const url = new URL(path, baseUrl)
  url.search = new URLSearchParams(options?.params ?? {}).toString()

  const controller = new AbortController()
  const timeoutMs = options?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)
  let response: Response

  try {
    response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options?.headers,
      },
      body:
        method !== HttpRequestMethod.GET
          ? JSON.stringify(options?.json)
          : undefined,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Farcaster API request timed out after ${timeoutMs.toString()}ms for ${method} ${url.pathname}`,
      )
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }

  const rawBody = await response.text()
  let data: FetchResponse = {}

  if (rawBody) {
    try {
      data = JSON.parse(rawBody) as FetchResponse
    } catch {
      if (!response.ok) {
        throw new Error(
          `Farcaster API request failed (${response.status.toString()} ${response.statusText}) for ${method} ${url.pathname}: ${rawBody.slice(0, 500)}`,
        )
      }

      throw new Error(
        `Farcaster API returned non-JSON response for ${method} ${url.pathname}`,
      )
    }
  }

  if (!response.ok) {
    const apiErrorMessage = getFirstApiErrorMessage(data)
    const fallbackBody = rawBody ? rawBody.slice(0, 500) : 'empty response body'
    throw new Error(
      `Farcaster API request failed (${response.status.toString()} ${response.statusText}) for ${method} ${url.pathname}: ${apiErrorMessage ?? fallbackBody}`,
    )
  }

  if (data.errors && data.errors.length > 0) {
    throw new Error(
      getFirstApiErrorMessage(data) ?? 'Unknown Farcaster API error',
    )
  }

  return data as T
}
