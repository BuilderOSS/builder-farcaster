/**
 * Parses a boolean-like environment variable.
 * @param value - Raw environment value.
 * @param defaultValue - Fallback value when not provided.
 * @returns Parsed boolean value.
 */
export function parseBooleanEnv(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true
  }

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false
  }

  return defaultValue
}

/**
 * Returns whether invite processing is enabled.
 * Defaults to false to keep invites disabled unless explicitly enabled.
 * @returns True if invites are enabled.
 */
export function isInvitesEnabled(): boolean {
  return parseBooleanEnv(process.env.ENABLE_INVITES, false)
}
