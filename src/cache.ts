import { prisma } from './db.js'

/**
 * Stores the provided value in the cache with the specified key.
 * @param key - The key associated with the value to cache.
 * @param value - The value to store in the cache. This value will be serialized to a string.
 * @returns Resolves when the value has been successfully stored in the cache.
 */
export async function setCache(key: string, value: unknown): Promise<void> {
  const timestamp = new Date()
  const valueString = JSON.stringify(value)

  await prisma.cache.upsert({
    where: { key },
    update: { value: valueString, timestamp },
    create: { key, value: valueString, timestamp },
  })
}

/**
 * Retrieves a cached item by its key and ensures it is not older than the specified maximum age.
 * @param key - The key of the cached item to retrieve.
 * @param maxAgeMs - The maximum age in milliseconds for the cached item to be considered valid.
 * @returns The cached item if found and valid, or null if not found or expired.
 */
export async function getCache<T>(
  key: string,
  maxAgeMs?: number,
): Promise<T | null> {
  const cacheEntry = await prisma.cache.findUnique({
    where: { key },
  })

  if (!cacheEntry) {
    return null
  }

  if (maxAgeMs !== undefined) {
    const age = Date.now() - new Date(cacheEntry.timestamp).getTime()
    if (age >= maxAgeMs) {
      // Cache is expired, you may optionally delete it here
      await prisma.cache.delete({ where: { key } })
      return null
    }
  }

  return JSON.parse(cacheEntry.value) as T
}
