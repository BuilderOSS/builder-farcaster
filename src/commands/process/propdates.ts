import { getCache, setCache } from '@/cache'
import {
  getFollowerAddresses,
  getFollowerDAOs,
  getFollowerFids,
  getProposalFromId,
  getUserFid,
} from '@/commands'
import { logger } from '@/logger'
import { addToQueue } from '@/queue'
import { getPropdateAttestations } from '@/services/eas/get-propdate-attestations'
import { filter, pipe } from 'remeda'
import { JsonValue } from 'type-fest'

/**
 * Processes new proposal updates and sends notifications to relevant followers
 * @returns A promise that resolves when all updates have been processed
 * @throws Error if there's an issue fetching or processing updates
 */
async function handleProposalUpdates() {
  try {
    logger.info('Fetching new propdates...')
    const { propdates } = await getPropdateAttestations()
    logger.info({ propdates }, 'New propdates retrieved.')

    const userFid = await getUserFid()
    logger.debug({ userFid }, 'User FID retrieved.')
    const followers = await getFollowerFids(userFid)
    logger.info({ followerCount: followers.length }, 'Follower FIDs retrieved.')
    for (const follower of followers) {
      logger.debug({ follower }, 'Processing follower.')
      // Retrieve the ethereum addresses associated with the current follower
      let addresses = await getFollowerAddresses(follower)
      logger.debug({ follower, addresses }, 'Follower addresses retrieved.')

      addresses = pipe(
        addresses,
        filter((address) => /^0x[a-fA-F0-9]{40}$/.test(address)),
      )
      logger.debug(
        { follower, addresses },
        'Filtered valid Ethereum addresses.',
      )

      // If no addresses are found, skip to the next follower
      if (addresses.length === 0) {
        logger.info(
          { follower },
          'No valid addresses found for follower, skipping.',
        )
        continue
      }

      // Retrieve the DAOs associated with the current follower and their addresses
      const daos = await getFollowerDAOs(follower, addresses)
      logger.debug(
        { follower, daos },
        'DAOs associated with follower retrieved.',
      )

      // If no DAOs are found, skip to the next follower
      if (!daos || daos.length <= 0) {
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
        const proposal = await getProposalFromId(
          propdate.chain,
          propdate.proposalId,
        )

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
          'Adding proposal update to notification queue.',
        )
        await addToQueue({
          type: 'notification',
          recipient: follower,
          propdate: propdate as unknown as JsonValue,
          proposal: proposal as unknown as JsonValue,
        })

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
      await setCache(cacheKey, Array.from(notifiedUpdatesSet))
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
 */
export async function processUpdates() {
  await handleProposalUpdates()
}
