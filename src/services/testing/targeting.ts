export interface TargetingOptions {
  targetFids?: number[]
  targetDaoIds?: string[]
  targetChains?: string[]
  dryRun?: boolean
}

type QueryValue = string | string[] | undefined

interface TargetingQuery {
  fid?: QueryValue
  daoId?: QueryValue
  chain?: QueryValue
  dryRun?: QueryValue
}

/**
 * Normalizes a query value to a single string.
 * @param value - Query value as string or array.
 * @returns Single query value.
 */
function toSingleValue(value: QueryValue): string | undefined {
  if (value === undefined) {
    return undefined
  }

  return Array.isArray(value) ? value[0] : value
}

/**
 * Parses a comma-separated string into an array.
 * @param value - CSV-like string.
 * @returns Array of non-empty values.
 */
function parseCsv(value: string | undefined): string[] {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

/**
 * Parses a comma-separated string into numeric FIDs.
 * @param raw - Raw FID CSV.
 * @returns Valid positive integer FIDs.
 */
function parseFids(raw: string | undefined): number[] {
  return parseCsv(raw)
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0)
}

/**
 * Parses a boolean-like string.
 * @param raw - Raw boolean-like value.
 * @returns Parsed boolean or undefined.
 */
function parseBoolean(raw: string | undefined): boolean | undefined {
  if (!raw) {
    return undefined
  }

  const normalized = raw.trim().toLowerCase()

  if (['true', '1', 'yes'].includes(normalized)) {
    return true
  }

  if (['false', '0', 'no'].includes(normalized)) {
    return false
  }

  return undefined
}

/**
 * Lowercases DAO IDs for matching.
 * @param values - Raw DAO IDs.
 * @returns Normalized DAO IDs.
 */
function normalizeDaoIds(values: string[]): string[] {
  return values.map((value) => value.toLowerCase())
}

/**
 * Lowercases chain names for matching.
 * @param values - Raw chain values.
 * @returns Normalized chain names.
 */
function normalizeChains(values: string[]): string[] {
  return values.map((value) => value.toLowerCase())
}

/**
 * Builds targeting options from environment variables.
 * @returns Parsed targeting options for test runs.
 */
export function getTargetingOptionsFromEnv(): TargetingOptions {
  const targetFids = parseFids(process.env.TEST_TARGET_FIDS)
  const targetDaoIds = normalizeDaoIds(
    parseCsv(process.env.TEST_TARGET_DAO_IDS),
  )
  const targetChains = normalizeChains(parseCsv(process.env.TEST_TARGET_CHAINS))
  const dryRun = parseBoolean(process.env.TEST_DRY_RUN)

  return {
    ...(targetFids.length > 0 && { targetFids }),
    ...(targetDaoIds.length > 0 && { targetDaoIds }),
    ...(targetChains.length > 0 && { targetChains }),
    ...(dryRun !== undefined && { dryRun }),
  }
}

/**
 * Builds targeting options from API query parameters.
 * @param query - Request query params.
 * @returns Parsed targeting options.
 */
export function getTargetingOptionsFromQuery(
  query: TargetingQuery,
): TargetingOptions {
  const targetFids = parseFids(toSingleValue(query.fid))
  const targetDaoIds = normalizeDaoIds(parseCsv(toSingleValue(query.daoId)))
  const targetChains = normalizeChains(parseCsv(toSingleValue(query.chain)))
  const dryRun = parseBoolean(toSingleValue(query.dryRun))

  return {
    ...(targetFids.length > 0 && { targetFids }),
    ...(targetDaoIds.length > 0 && { targetDaoIds }),
    ...(targetChains.length > 0 && { targetChains }),
    ...(dryRun !== undefined && { dryRun }),
  }
}

/**
 * Merges two targeting option objects with query taking precedence.
 * @param base - Base options, typically from environment variables.
 * @param overrides - Override options, typically from API query params.
 * @returns Merged targeting options.
 */
export function mergeTargetingOptions(
  base: TargetingOptions,
  overrides: TargetingOptions,
): TargetingOptions {
  return {
    ...base,
    ...overrides,
  }
}
