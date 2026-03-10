import { signAsync } from '@noble/ed25519'

import { Env } from '@/services/warpcast/types'

const AUTH_TOKEN_TTL_SECONDS = 300

interface CachedToken {
  expiresAtMs: number
  token: string
}

let cachedToken: CachedToken | undefined

/**
 * Encodes input as base64url.
 * @param value - Value to encode.
 * @returns Base64url-encoded string.
 */
function toBase64Url(value: string | Uint8Array): string {
  const bytes = typeof value === 'string' ? Buffer.from(value, 'utf8') : value

  return Buffer.from(bytes)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/g, '')
}

/**
 * Decodes a hex private key string with optional 0x prefix.
 * @param value - Hex private key.
 * @returns Private key bytes.
 */
function decodePrivateKey(value: string): Uint8Array {
  const normalized = value.trim().replace(/^0x/i, '')

  if (!/^[\da-f]{64}$/i.test(normalized)) {
    throw new Error('FARCASTER_APP_KEY must be a 32-byte hex string')
  }

  return new Uint8Array(Buffer.from(normalized, 'hex'))
}

/**
 * Returns a short-lived bearer token for authenticated Farcaster client API routes.
 * @param env - Warpcast/Farcaster environment configuration.
 * @returns Signed app-key token.
 */
export async function getWarpcastAuthToken(env: Env): Promise<string> {
  const now = Date.now()

  if (cachedToken && cachedToken.expiresAtMs > now + 10_000) {
    return cachedToken.token
  }

  const { FARCASTER_APP_FID, FARCASTER_APP_KEY, FARCASTER_APP_KEY_PUBLIC } = env

  if (!FARCASTER_APP_FID || !FARCASTER_APP_KEY || !FARCASTER_APP_KEY_PUBLIC) {
    throw new Error(
      'Missing FARCASTER_APP_FID/FARCASTER_APP_KEY/FARCASTER_APP_KEY_PUBLIC for authenticated Farcaster API routes',
    )
  }

  const fid = Number.parseInt(FARCASTER_APP_FID, 10)
  if (!Number.isFinite(fid) || fid <= 0) {
    throw new Error('FARCASTER_APP_FID must be a positive integer')
  }

  const header = {
    fid,
    key: FARCASTER_APP_KEY_PUBLIC,
    type: 'app_key',
  }

  const payload = {
    exp: Math.floor(now / 1000) + AUTH_TOKEN_TTL_SECONDS,
  }

  const encodedHeader = toBase64Url(JSON.stringify(header))
  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const message = `${encodedHeader}.${encodedPayload}`

  const signature = await signAsync(
    Buffer.from(message, 'utf8'),
    decodePrivateKey(FARCASTER_APP_KEY),
  )

  const token = `${message}.${toBase64Url(signature)}`

  cachedToken = {
    expiresAtMs: now + (AUTH_TOKEN_TTL_SECONDS - 5) * 1000,
    token,
  }

  return token
}
