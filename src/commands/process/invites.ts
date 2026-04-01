import { getCache, setCache } from '@/cache'
import { CACHE_MAX_AGE_MS, getFollowerFids, getUserFid } from '@/commands'
import { env } from '@/config'
import { logger } from '@/logger'
import { addToQueue } from '@/queue'
import { getDAOsTokenOwners } from '@/services/builder/get-daos-token-owners'
import type { Dao, Owner } from '@/services/builder/types'
import { getUserByVerification } from '@/services/farcaster/get-user-by-verification'
import type { EnvWithAppKeys } from '@/services/farcaster/types'
import { TargetingOptions } from '@/services/testing/targeting'
import {
  concat,
  entries,
  fromEntries,
  groupBy,
  keys,
  map,
  mapValues,
  pipe,
  sort,
  unique,
} from 'remeda'
import { JsonValue } from 'type-fest'

/**
 * Type guard for env objects that include required app-key auth fields.
 * @param value - Runtime env object.
 * @returns True when app-key fields are present.
 */
function hasAppKeyEnv(value: typeof env): value is EnvWithAppKeys {
  return Boolean(
    value.FARCASTER_APP_FID &&
      value.FARCASTER_APP_KEY &&
      value.FARCASTER_APP_KEY_PUBLIC,
  )
}

/**
 * Returns whether invite processing is enabled.
 * @returns False until app-key auth for invite lookups is validated.
 */
function isInvitesFlowEnabled(): boolean {
  return false
}

/**
 * Returns whether a target FID should receive invite processing.
 * @param fid - Candidate Farcaster ID.
 * @param options - Optional targeting configuration.
 * @returns True when invite should be processed for this FID.
 */
function shouldProcessInviteFid(
  fid: number,
  options: TargetingOptions,
): boolean {
  if (!options.targetFids || options.targetFids.length === 0) {
    return true
  }

  return options.targetFids.includes(fid)
}

/**
 * Filters DAOs according to optional DAO and chain targeting.
 * @param daos - Candidate DAO list for a FID.
 * @param options - Optional targeting configuration.
 * @returns DAOs matching active filters.
 */
function filterTargetDaos(daos: Dao[], options: TargetingOptions): Dao[] {
  return daos.filter((dao) => {
    if (options.targetDaoIds && options.targetDaoIds.length > 0) {
      if (!options.targetDaoIds.includes(dao.id.toLowerCase())) {
        return false
      }
    }

    if (options.targetChains && options.targetChains.length > 0) {
      if (!options.targetChains.includes(dao.chain.name.toLowerCase())) {
        return false
      }
    }

    return true
  })
}

/**
 * Handles invitations by fetching DAO owners, mapping them to their respective
 * FIDs, and creating an owner-to-DAO mapping.
 * @param options - Optional targeting configuration.
 */
export async function processInvitesCommand(options: TargetingOptions = {}) {
  if (!isInvitesFlowEnabled()) {
    // TODO(invites): Re-enable when app-key authenticated owner->fid lookup is
    // validated end-to-end. Keep this disabled to avoid partial invite execution.
    logger.warn(
      { options },
      'Invites flow is intentionally disabled pending app-key auth validation.',
    )
    return
  }

  try {
    const sortedFidToDaoMap = await getSortedFidToDaoMap(options)
    logger.debug(
      {
        sortedFidToDaoMap,
        sortedFidToDaoSize: keys(sortedFidToDaoMap).length,
      },
      'Sorted fidToDaoMap',
    )

    // Retrieve all followers once (assuming there's a shared user fid cacheable by getUserFid)
    const followers = await getFollowerFids(getUserFid())
    logger.debug(
      { followersCount: followers.length },
      'Followers retrieved successfully',
    )

    const fidDaoEntries = entries<Record<number, Dao[]>>(sortedFidToDaoMap)
    logger.debug(
      { fidDaoEntriesCount: fidDaoEntries.length },
      'FID to DAO entries retrieved successfully',
    )

    for (const [fid, daos] of fidDaoEntries) {
      const numericFid = Number(fid)

      if (!shouldProcessInviteFid(numericFid, options)) {
        continue
      }

      if (followers.includes(numericFid)) {
        continue
      }

      const targetDaos = filterTargetDaos(daos, options)
      if (targetDaos.length === 0) {
        continue
      }

      const sortedDaos = sort(targetDaos, (a, b) => b.ownerCount - a.ownerCount)

      logger.info(
        { fid, daos: sortedDaos, dryRun: options.dryRun === true },
        options.dryRun
          ? 'Dry run: invitation would be added to queue for member'
          : 'Invitation added to queue for member',
      )

      if (!options.dryRun) {
        await addToQueue({
          type: 'invitation',
          recipient: numericFid,
          daos: sortedDaos as unknown as JsonValue,
        })
      }
    }
  } catch (error) {
    logger.error(
      {
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Error executing async function',
    )
  }
}

/**
 * Retrieves a sorted map of FIDs (Federated Identifiers) to DAOs (Decentralized Autonomous Organizations).
 * This method fetches DAOs token owners, groups them by owner address, maps FIDs to DAOs,
 * and finally sorts the map by the number of DAOs associated with each FID.
 * @param options - Optional targeting configuration.
 * @returns A promise that resolves to an object where the keys are FIDs and the values are arrays of DAOs, sorted by the number of DAOs.
 */
async function getSortedFidToDaoMap(options: TargetingOptions) {
  const cacheKey = 'sorted_fid_to_dao_map'
  let sortedFidToDaoMap = await getCache<Record<number, Dao[]> | null>(
    cacheKey,
    CACHE_MAX_AGE_MS,
  )

  if (sortedFidToDaoMap) {
    logger.debug('Sorted FID to DAO map fetched from cache')
  } else {
    logger.info('Fetching DAOs token owners')
    const { owners } = await getDAOsTokenOwners(env)
    logger.debug({ owners }, 'Fetched owners')

    logger.info('Grouping owners by owner address')
    const ownerToDaosMap = groupOwnersByOwnerAddress(owners)
    logger.debug({ ownerToDaosMap }, 'Grouped owners into ownerToDaosMap')

    logger.info('Fetching FIDs for each owner and mapping DAOs')
    const fidToDaoMap = await mapFIDsToDAOs(ownerToDaosMap)

    logger.info('Sorting fidToDaoMap by the number of DAOs')
    sortedFidToDaoMap = sortFidToDaoMap(fidToDaoMap)

    if (!options.dryRun) {
      await setCache(cacheKey, sortedFidToDaoMap)
      logger.info('Sorted FID to DAO map fetched and cached successfully')
    }
  }

  return sortedFidToDaoMap
}

/**
 * Groups an array of owners by their owner address and maps each owner to a new format.
 * @param owners - The list of owners to be grouped. Each owner should have an `owner` field and a `dao` object with `id` and `name` properties.
 * @returns An object where each key is an owner address and the value is an array of Daos associated with that owner.
 */
function groupOwnersByOwnerAddress(owners: Owner[]) {
  return pipe(
    owners,
    groupBy((owner) => owner.owner),
    mapValues((owners) =>
      map(
        owners,
        (owner) =>
          ({
            id: owner.dao.id,
            name: owner.dao.name,
            ownerCount: owner.dao.ownerCount,
          }) as Dao,
      ),
    ),
  )
}

/**
 * Maps owner addresses to DAOs and retrieves their respective FIDs.
 * Updates a map of FIDs to DAOs by ensuring no duplicates.
 * @param ownerToDaosMap - A record mapping owner addresses to arrays of DAOs.
 * @returns A map of FIDs to their corresponding DAOs.
 */
async function mapFIDsToDAOs(ownerToDaosMap: Record<string, Dao[]>) {
  const fidToDaoMap: Record<number, Dao[]> = {}
  for (const [owner, daos] of entries(ownerToDaosMap)) {
    try {
      const fid = await fetchFIDForOwner(owner)
      if (fid) {
        fidToDaoMap[fid] = pipe(fidToDaoMap[fid] ?? [], concat(daos), unique())
        logger.debug({ fid, daos }, 'Updated fidToDaoMap with new DAOs')
      }
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          error.message.startsWith('No FID has connected')
        )
      ) {
        logger.error({ error }, 'Error fetching Farcaster user.')
      }
    }
  }
  return fidToDaoMap
}

/**
 * Fetches the FID (Federation Identifier) associated with the specified owner.
 * @param owner - The owner identifier for which to fetch the FID.
 * @returns A promise that resolves to the fetched FID.
 */
async function fetchFIDForOwner(owner: string) {
  logger.debug({ owner }, 'Fetching FID for owner')

  if (!hasAppKeyEnv(env)) {
    throw new Error(
      'Missing FARCASTER_APP_FID/FARCASTER_APP_KEY/FARCASTER_APP_KEY_PUBLIC for invite owner lookup',
    )
  }

  const {
    user: { fid },
  } = await getUserByVerification(env, owner)
  logger.debug({ fid, owner }, 'Fetched FID for owner')
  return fid
}

/**
 * Sorts the given map of FID to DAO arrays by the length of the DAO arrays.
 * @param fidToDaoMap - A map where keys are numerical FIDs and values are arrays of DAO objects.
 * @returns A new map where the key-value pairs are sorted by the length of the DAO arrays.
 */
function sortFidToDaoMap(fidToDaoMap: Record<number, Dao[]>) {
  return pipe(
    fidToDaoMap,
    entries<Record<number, Dao[]>>,
    sort(([, daosA], [, daosB]) => daosA.length - daosB.length),
    (sortedEntries) =>
      fromEntries(sortedEntries.map(([key, value]) => [Number(key), value])),
  ) as Record<number, Dao[]>
}
