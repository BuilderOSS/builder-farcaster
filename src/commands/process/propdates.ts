import { getCache, setCache } from '@/cache'
import {
  getFollowerFids,
  getFollowersDaoMap,
  getProposalFromId,
  getUserFid,
} from '@/commands'
import { logger } from '@/logger'
import { addToQueue } from '@/queue'
import { Proposal } from '@/services/builder/types'
import { getPropdateAttestations } from '@/services/eas/get-propdate-attestations'
import { TargetingOptions } from '@/services/testing/targeting'
import { filter } from 'remeda'
import { JsonValue } from 'type-fest'

/**
 * Checks whether the follower should be processed based on targeting options.
 * @param follower - Farcaster follower FID.
 * @param options - Optional targeting configuration.
 * @returns True when this follower should be processed.
 */
function shouldProcessFollower(
  follower: number,
  options: TargetingOptions,
): boolean {
  if (!options.targetFids || options.targetFids.length === 0) {
    return true
  }

  return options.targetFids.includes(follower)
}

/**
 * Builds a stable proposal lookup key.
 * @param chainId - Chain identifier.
 * @param proposalId - Proposal id.
 * @returns Stable key for map lookups.
 */
function getProposalKey(chainId: number, proposalId: string): string {
  return `${chainId.toString()}:${proposalId.toLowerCase()}`
}

/**
 * Prefetches proposals needed for propdates processing.
 * @param proposalRefs - Proposal refs with chain id and proposal id.
 * @returns Map of proposal key to proposal payload.
 */
async function buildProposalLookup(
  proposalRefs: {
    chain: { id: number }
    proposalId: string
  }[],
): Promise<Map<string, Proposal | null | undefined>> {
  const uniqueRefs = new Map<string, (typeof proposalRefs)[number]>()

  for (const proposalRef of proposalRefs) {
    const proposalKey = getProposalKey(
      proposalRef.chain.id,
      proposalRef.proposalId,
    )
    if (!uniqueRefs.has(proposalKey)) {
      uniqueRefs.set(proposalKey, proposalRef)
    }
  }

  const proposalLookup = new Map<string, Proposal | null | undefined>()
  for (const [proposalKey, proposalRef] of uniqueRefs) {
    const proposal = await getProposalFromId(
      proposalRef.chain,
      proposalRef.proposalId,
    )
    proposalLookup.set(proposalKey, proposal)
  }

  return proposalLookup
}

/**
 * Processes new proposal updates and sends notifications to relevant followers
 * @param options - Optional targeting configuration.
 * @returns A promise that resolves when all updates have been processed
 * @throws Error if there's an issue fetching or processing updates
 */
async function handleProposalUpdates(options: TargetingOptions) {
  try {
    logger.info('Fetching new propdates...')
    const { propdates: fetchedPropdates } = await getPropdateAttestations()
    const propdates = filter(fetchedPropdates, (propdate) => {
      if (options.targetChains && options.targetChains.length > 0) {
        const chainName = propdate.chain.name.toLowerCase()
        if (!options.targetChains.includes(chainName)) {
          return false
        }
      }

      return true
    })

    logger.info({ propdates }, 'New propdates retrieved.')

    const proposalLookup = await buildProposalLookup(
      propdates.map((propdate) => ({
        chain: propdate.chain,
        proposalId: propdate.proposalId,
      })),
    )
    logger.info(
      { proposalLookupCount: proposalLookup.size },
      'Propdate proposal lookup prepared.',
    )

    const userFid = getUserFid()
    logger.debug({ userFid }, 'User FID retrieved.')
    const followers = await getFollowerFids(userFid)
    const scopedFollowers = followers.filter((follower) =>
      shouldProcessFollower(follower, options),
    )
    logger.info(
      {
        followerCount: followers.length,
        scopedFollowerCount: scopedFollowers.length,
      },
      'Follower FIDs retrieved.',
    )

    if (scopedFollowers.length === 0) {
      logger.warn(
        'No followers matched targeting options, terminating execution.',
      )
      return
    }

    const followerDaosMap = await getFollowersDaoMap(scopedFollowers)
    for (const follower of scopedFollowers) {
      logger.debug({ follower }, 'Processing follower.')
      const daos = followerDaosMap[follower] ?? []
      logger.debug(
        { follower, daos },
        'DAOs associated with follower retrieved.',
      )

      // If no DAOs are found, skip to the next follower
      if (daos.length <= 0) {
        logger.info({ follower }, 'No DAOs found for follower, skipping.')
        continue
      }

      // Retrieve notified updates from cache
      const cacheKey = `notified_proposals_updates_${follower.toString()}`
      logger.debug({ cacheKey }, 'Retrieving notified updates from cache.')
      let notifiedUpdates = await getCache<string[]>(cacheKey)
      if (!notifiedUpdates) {
        logger.info(
          { follower },
          'No notified updates found in cache, initializing new set.',
        )
        notifiedUpdates = []
      } else {
        logger.debug(
          { follower, notifiedUpdates },
          'Notified updates retrieved from cache.',
        )
      }

      // Convert notifiedUpdates to a Set for efficient lookups
      const notifiedUpdatesSet = new Set(notifiedUpdates)

      // Loop through each proposal in the filtered propdates array
      for (const propdate of propdates) {
        logger.debug(
          {
            propdateId: propdate.id,
            proposalId: propdate.proposalId,
          },
          'Processing proposal update for follower.',
        )

        // get proposal data from proposal id
        const proposalKey = getProposalKey(
          propdate.chain.id,
          propdate.proposalId,
        )
        const proposal = proposalLookup.get(proposalKey)

        if (!proposal) {
          // skip if proposal doesn't exist or Json parsing error
          logger.debug(
            {
              propdateId: propdate.id,
              proposalId: propdate.proposalId,
            },
            'Proposal not found, skipping.',
          )
          continue
        }

        if (
          options.targetDaoIds &&
          options.targetDaoIds.length > 0 &&
          !options.targetDaoIds.includes(proposal.dao.id.toLowerCase())
        ) {
          continue
        }

        // If the proposal's DAO ID is not in the list of DAOs for the current follower, skip to the next update
        if (!daos.includes(proposal.dao.id)) {
          logger.debug(
            {
              propdateId: propdate.id,
              proposalId: propdate.proposalId,
              follower,
            },
            'Proposal DAO ID not associated with follower, skipping.',
          )
          continue
        }

        // Check if this propdate has already been notified
        if (notifiedUpdatesSet.has(propdate.id)) {
          logger.debug(
            {
              propdateId: propdate.id,
              proposalId: propdate.proposalId,
              follower,
            },
            'Proposal update already notified, skipping.',
          )
          continue
        }

        // Add the proposal to the queue for notifications
        logger.info(
          {
            propdateId: propdate.id,
            proposalId: propdate.proposalId,
            follower,
          },
          options.dryRun
            ? 'Dry run: proposal update would be added to notification queue.'
            : 'Adding proposal update to notification queue.',
        )
        if (!options.dryRun) {
          await addToQueue({
            type: 'notification',
            recipient: follower,
            propdate: propdate as unknown as JsonValue,
            proposal: proposal as unknown as JsonValue,
          })
        }

        // Mark this update as notified
        notifiedUpdatesSet.add(propdate.id)
        logger.debug(
          {
            propdateId: propdate.id,
            proposalId: propdate.proposalId,
            follower,
          },
          'Proposal Update marked as notified.',
        )
      }

      // Update the cache with the new set of notified proposals updates
      logger.debug(
        { cacheKey, notifiedProposals: Array.from(notifiedUpdatesSet) },
        'Updating cache with notified proposals.',
      )
      if (!options.dryRun) {
        await setCache(cacheKey, Array.from(notifiedUpdatesSet))
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        { message: error.message, stack: error.stack },
        'Failed to process proposal updates',
      )
    } else {
      logger.error({ error }, 'Unknown error while processing proposal updates')
    }
    throw error // Re-throw to allow proper error handling upstream
  }
}

/**
 * Handles notifications for new proposal updates
 *
 * This function triggers notifications for proposal updates that are currently active.
 * @param options - Optional targeting configuration.
 */
export async function processUpdates(options: TargetingOptions = {}) {
  await handleProposalUpdates(options)
}
