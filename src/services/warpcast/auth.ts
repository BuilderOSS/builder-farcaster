import { Env } from '@/services/warpcast/types'

/**
 * Returns a bearer token for authenticated Farcaster client API routes.
 * @param env - Warpcast/Farcaster environment configuration.
 * @returns Legacy auth token.
 */
export function getWarpcastAuthToken(env: Env): string {
  if (env.WARPCAST_AUTH_TOKEN) {
    return env.WARPCAST_AUTH_TOKEN
  }

  if (env.FARCASTER_MNEMONIC) {
    throw new Error(
      'Mnemonic-based token generation is no longer supported by the current Farcaster /v2 API. Set WARPCAST_AUTH_TOKEN for authenticated routes or run with BOT_FID/BOT_USERNAME and invites disabled.',
    )
  }

  throw new Error(
    'Missing auth configuration. Set WARPCAST_AUTH_TOKEN for authenticated Farcaster routes.',
  )
}
