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

  const response = await fetch(url.toString(), {
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
  })

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
