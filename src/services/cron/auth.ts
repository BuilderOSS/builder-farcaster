import { env } from '../../config'

/**
 * Validates whether an incoming request was sent by Vercel Cron.
 * @param authorizationHeader - Incoming authorization header value.
 * @returns True when the header matches the configured cron secret.
 */
export function isAuthorizedCronRequest(
  authorizationHeader: string | undefined,
): boolean {
  const secret = env.CRON_SECRET

  if (!secret) {
    return false
  }

  return authorizationHeader === `Bearer ${secret}`
}
