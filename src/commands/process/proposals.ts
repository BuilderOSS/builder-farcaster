import { getCache, setCache } from '@/cache'
import { getFollowerFids, getFollowersDaoMap, getUserFid } from '@/commands'
import { logger } from '@/logger'
import { addToQueue } from '@/queue'
import { getActiveProposals } from '@/services/builder/get-active-proposals'
import { Proposal } from '@/services/builder/types'
import { TargetingOptions } from '@/services/testing/targeting'
import { DateTime } from 'luxon'
import { filter } from 'remeda'
import { JsonValue } from 'type-fest'

interface ProposalTargetInput {
  dao: {
    id: string
    chain: {
      name: string
    }
  }
}

interface ProposalBuckets {
  endingProposals: Proposal[]
  votingProposals: Proposal[]
}

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
 * Checks whether a proposal matches test targeting filters.
 * @param proposal - Proposal with chain and DAO metadata.
 * @param options - Optional targeting configuration.
 * @returns True when proposal matches active filters.
 */
function matchesProposalTargets(
  proposal: ProposalTargetInput,
  options: TargetingOptions,
): boolean {
  const daoId = proposal.dao.id.toLowerCase()
  const chainName = proposal.dao.chain.name.toLowerCase()

  if (options.targetDaoIds && options.targetDaoIds.length > 0) {
    if (!options.targetDaoIds.includes(daoId)) {
      return false
    }
  }

  if (options.targetChains && options.targetChains.length > 0) {
    if (!options.targetChains.includes(chainName)) {
      return false
    }
  }

  return true
}

/**
 * Splits proposals into voting and ending buckets.
 * @param proposals - Candidate proposals.
 * @param currentUnixTimestamp - Current unix timestamp in seconds.
 * @returns Voting and ending proposal buckets.
 */
function splitProposalBuckets(
  proposals: Proposal[],
  currentUnixTimestamp: number,
): ProposalBuckets {
  const votingProposals = proposals.filter((proposal) => {
    const voteStartTimestamp = Number(proposal.voteStart)
    const voteEndTimestamp = Number(proposal.voteEnd)

    return (
      voteStartTimestamp < currentUnixTimestamp &&
      voteEndTimestamp > currentUnixTimestamp
    )
  })

  const endingProposals = proposals.filter((proposal) => {
    const voteEndTimestamp = Number(proposal.voteEnd)

    return (
      voteEndTimestamp > currentUnixTimestamp &&
      voteEndTimestamp <= currentUnixTimestamp + 86400
    )
  })

  return {
    endingProposals,
    votingProposals,
  }
}

/**
 * Processes notifications for a proposal set and follower list.
 * @param followers - Followers to process.
 * @param followerDaosMap - DAO ids per follower.
 * @param proposals - Proposals to notify about.
 * @param cacheKeyPrefix - Cache key prefix for notified proposal ids.
 * @param options - Optional targeting configuration.
 */
async function notifyFollowersForProposals(
  followers: number[],
  followerDaosMap: Record<number, string[]>,
  proposals: Proposal[],
  cacheKeyPrefix: string,
  options: TargetingOptions,
): Promise<void> {
  if (proposals.length === 0) {
    return
  }

  for (const follower of followers) {
    logger.debug({ follower }, 'Processing follower.')
    const daos = followerDaosMap[follower] ?? []

    if (daos.length === 0) {
      logger.info({ follower }, 'No DAOs found for follower, skipping.')
      continue
    }

    const cacheKey = `${cacheKeyPrefix}_${follower.toString()}`
    let notifiedProposals = await getCache<string[]>(cacheKey)
    if (!notifiedProposals) {
      notifiedProposals = []
    }

    const notifiedProposalsSet = new Set(notifiedProposals)

    for (const proposal of proposals) {
      if (!daos.includes(proposal.dao.id.toLowerCase())) {
        continue
      }

      if (notifiedProposalsSet.has(proposal.id)) {
        continue
      }

      logger.info(
        { proposalId: proposal.id, follower },
        options.dryRun
          ? 'Dry run: proposal would be added to notification queue.'
          : 'Adding proposal to notification queue.',
      )

      if (!options.dryRun) {
        await addToQueue({
          type: 'notification',
          recipient: follower,
          proposal: proposal as unknown as JsonValue,
        })
      }

      notifiedProposalsSet.add(proposal.id)
    }

    if (!options.dryRun) {
      await setCache(cacheKey, Array.from(notifiedProposalsSet))
    }
  }
}
/**
 * Handles notifications for both voting and ending proposals sequentially.
 *
 * This function triggers notifications for proposals that are currently active.
 * It ensures that notifications for voting proposals are processed first, followed
 * by ending proposals.
 * @param options - Optional targeting configuration.
 */
export async function processProposalsCommand(options: TargetingOptions = {}) {
  try {
    logger.info('Fetching active proposals...')
    const { proposals: activeProposals } = await getActiveProposals()
    logger.info(
      { proposalCount: activeProposals.length },
      'Active proposals retrieved.',
    )

    const filteredProposals = filter(activeProposals, (proposal) =>
      matchesProposalTargets(proposal, options),
    )

    const currentUnixTimestamp = DateTime.now().toSeconds()
    const { endingProposals, votingProposals } = splitProposalBuckets(
      filteredProposals,
      currentUnixTimestamp,
    )

    logger.info(
      {
        endingProposalCount: endingProposals.length,
        votingProposalCount: votingProposals.length,
      },
      'Proposal buckets prepared.',
    )

    if (endingProposals.length === 0 && votingProposals.length === 0) {
      logger.warn('No active or ending proposals found, terminating execution.')
      return
    }

    const userFid = getUserFid()
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

    await notifyFollowersForProposals(
      scopedFollowers,
      followerDaosMap,
      votingProposals,
      'notified_voting_proposals',
      options,
    )

    await notifyFollowersForProposals(
      scopedFollowers,
      followerDaosMap,
      endingProposals,
      'notified_ending_proposals',
      options,
    )
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        { message: error.message, stack: error.stack },
        'Error executing async function',
      )
    } else {
      logger.error({ error }, 'Unknown error occurred')
    }
  }
}
