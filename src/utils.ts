import { DateTime } from 'luxon'

/**
 * Converts a given timestamp to a relative time string.
 * @param timestamp - The timestamp to be converted.
 * @returns A relative time string.
 */
export function toRelativeTime(timestamp: number): string {
  return DateTime.fromSeconds(timestamp).toRelative({
    style: 'long',
    unit: ['days', 'hours', 'minutes'],
  })
}

/**
 * Checks if a given timestamp is in the past.
 * @param timestamp - The timestamp in seconds to be evaluated.
 * @returns true if the timestamp is in the past, false otherwise.
 */
export function isPast(timestamp: number) {
  return DateTime.fromSeconds(timestamp) < DateTime.now()
}
