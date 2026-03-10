/**
 * Prints migration guidance for current Farcaster auth behavior.
 */
export function warpcastToken(): void {
  console.log(
    [
      'The legacy /v2/auth token flow is no longer available.',
      'For this bot, prefer non-authenticated runtime with explicit bot identity:',
      '- BOT_FID or BOT_USERNAME',
      '- FARCASTER_MNEMONIC (optional compatibility value)',
      '- WARPCAST_AUTH_TOKEN only if you need auth-required endpoints (e.g. invites)',
      '',
      'Reference: https://docs.farcaster.xyz/reference/farcaster/api#authentication',
    ].join('\n'),
  )
}
