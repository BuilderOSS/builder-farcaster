import { getCache, setCache } from '@/cache'
import { env } from '@/config'
import { logger } from '@/logger'
import { getDAOsForOwners } from '@/services/builder/get-daos-for-owners'
import { getProposalData } from '@/services/builder/get-proposal-from-id'
import { Chain, Proposal } from '@/services/builder/types'
import { getFollowers } from '@/services/warpcast/get-followers'
import { getMe } from '@/services/warpcast/get-me'
import { getVerifications } from '@/services/warpcast/get-verifications'
import { Hex } from 'viem'

export const CACHE_MAX_AGE_MS = 86400 * 1000 // 1 day in milliseconds

/**
 * Retrieves the follower FIDs (unique follower IDs) for a given FID (unique ID).
 * The method attempts to fetch the follower FIDs from the cache first. If they are not
 * found in the cache, it fetches them from the source and caches the result for future use.
 * @param fid - The unique ID for which to find the follower FIDs.
 * @returns - A promise that resolves to an array of follower FIDs.
 */
export async function getFollowerFids(fid: number) {
  const cacheKey = `followers_fids_${fid.toString()}`
  let followers = await getCache<number[] | null>(cacheKey, CACHE_MAX_AGE_MS)

  if (followers) {
    logger.debug({ fid, followers }, 'Follower FIDs fetched from cache')
  } else {
    const { users } = await getFollowers(env, fid)
    followers = users.map((user) => user.fid) // Extract FIDs only
    await setCache(cacheKey, followers)
    logger.info(
      { fid, followers },
      'Follower FIDs fetched and cached successfully',
    )
  }
  return followers
}

/**
 * Retrieves the follower's verification addresses from cache or fetches them if not found in cache.
 * @param follower - The Follower's unique identifier.
 * @returns - A promise that resolves to an array of verification addresses.
 */
export async function getFollowerAddresses(follower: number) {
  const cacheKey = `addresses_${follower.toString()}`
  let addresses = await getCache<string[] | null>(cacheKey, CACHE_MAX_AGE_MS)

  if (addresses) {
    logger.debug({ follower, addresses }, 'Addresses fetched from cache')
  } else {
    const { verifications } = await getVerifications(env, follower)
    addresses = verifications.map((verification) =>
      verification.address.toLowerCase(),
    )
    await setCache(cacheKey, addresses)
    logger.info(
      { follower, addresses },
      'Addresses fetched and cached successfully',
    )
  }
  return addresses
}

/**
 * Fetches the DAO (Decentralized Autonomous Organization) identifiers associated with a given follower ID.
 * The method first attempts to retrieve these identifiers from cache; if not present, it fetches them
 * using the provided verification addresses, caches the result, and then returns the identifiers.
 * @param follower - The unique identifier of the follower.
 * @param addresses - An array of addresses used to verify ownership.
 * @returns A promise that resolves to an array of DAO identifiers, or null if none are found.
 */
export async function getFollowerDAOs(follower: number, addresses: string[]) {
  const cacheKey = `dao_ids_${follower.toString()}`
  let daoIds = await getCache<string[] | null>(cacheKey, CACHE_MAX_AGE_MS)

  if (daoIds) {
    logger.debug(
      { followerFid: follower, daoIds },
      'DAO IDs fetched from cache',
    )
  } else {
    if (addresses.length > 0) {
      const { daos } = await getDAOsForOwners(env, addresses)
      daoIds = daos.map((dao) => dao.id.toLowerCase()) // Extract DAO IDs only
      await setCache(cacheKey, daoIds)
      logger.info(
        { follower, daoIds },
        'DAO IDs fetched and cached successfully',
      )
    }
  }

  return daoIds
}

/**
 * Retrieves the user's FID (Federated ID). This function first attempts to fetch the
 * FID from a cache. If the FID is not found in the cache, it fetches the FID via
 * the `getMe` function and then stores it in the cache for future requests.
 * @returns A promise that resolves to the user's FID.
 */
export async function getUserFid() {
  const cacheKey = 'user_fid'
  let fid = await getCache<number | null>(cacheKey, CACHE_MAX_AGE_MS)

  if (fid) {
    logger.debug({ fid }, 'User FID fetched from cache')
  } else {
    const { user } = await getMe(env)
    fid = user.fid
    await setCache(cacheKey, fid)
    logger.info({ fid }, 'User FID fetched and cached successfully')
  }
  return fid
}

/**
 * Retrieves proposal data for a given proposal ID
 * @param chain - The blockchain network to query
 * @param proposalId - proposal Id
 * @returns A promise that resolves to the DAO object
 */
export async function getProposalFromId(chain: Chain, proposalId: Hex) {
  const cacheKey = `propdate_${proposalId.toLowerCase()}`
  let proposal = await getCache<Proposal | null>(cacheKey, CACHE_MAX_AGE_MS)

  if (proposal) {
    logger.debug({ proposal }, 'Proposal fetched from cache')
  } else {
    try {
      const response = await getProposalData(chain, proposalId)
      proposal = response.proposal
      await setCache(cacheKey, proposal)
      logger.info({ proposal }, 'Proposal cached successfully')
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Proposal does not exist')) {
          logger.error(
            { message: error.message, stack: error.stack },
            'Invalid Proposal Id',
          )
        }
      } else {
        // handle other errors
        throw error
      }
    }
  }
  return proposal
}
