import { PUBLIC_ALL_CHAINS, RPC_URLS } from '@buildeross/constants'
import { ProposalState } from '@buildeross/types'
import { getProposalWarning } from '@buildeross/utils'
import { DateTime } from 'luxon'
import { JsonValue } from 'type-fest'
import { Chain as ViemChain, createPublicClient, http, isAddress } from 'viem'
import { getCache, setCache } from '../../cache.js'
import { logger } from '../../logger.js'
import { addToQueue } from '../../queue.js'
import { getActiveProposals } from '../../services/builder/get-active-proposals.js'
import { Proposal } from '../../services/builder/types.js'
import { TargetingOptions } from '../../services/testing/targeting.js'
import { getFollowerFids, getFollowersDaoMap, getUserFid } from '../index.js'

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

const chainById: ReadonlyMap<number, ViemChain> = new Map(
  PUBLIC_ALL_CHAINS.map((chain) => [chain.id, chain]),
)

/**
 * Derives proposal state for warning evaluation from voting timestamps.
 * @param proposal - Proposal to evaluate.
 * @param currentUnixTimestamp - Current unix timestamp in seconds.
 * @returns Derived proposal state.
 */
function deriveProposalState(
  proposal: Proposal,
  currentUnixTimestamp: number,
): ProposalState {
  const voteStartTimestamp = Number(proposal.voteStart)

  if (voteStartTimestamp > currentUnixTimestamp) {
    return ProposalState.Pending
  }

  return ProposalState.Active
}

/**
 * Reads treasury native-token balance for a proposal DAO.
 * @param proposal - Proposal containing chain and treasury metadata.
 * @param balanceCache - In-memory cache keyed by chain and treasury.
 * @returns Treasury balance when retrievable.
 */
async function getTreasuryBalance(
  proposal: Proposal,
  balanceCache: Map<string, bigint>,
): Promise<bigint | undefined> {
  const chainId = proposal.dao.chain.id
  const treasuryAddress = proposal.dao.treasuryAddress

  if (!treasuryAddress || !isAddress(treasuryAddress)) {
    return undefined
  }

  const cacheKey = `${chainId.toString()}:${treasuryAddress.toLowerCase()}`
  const cachedBalance = balanceCache.get(cacheKey)

  if (cachedBalance !== undefined) {
    return cachedBalance
  }

  const rpcUrlsByChain = RPC_URLS as Partial<Record<number, readonly string[]>>
  const rpcUrls = rpcUrlsByChain[chainId]

  if (!Array.isArray(rpcUrls) || rpcUrls.length === 0) {
    return undefined
  }

  const firstRpcUrl = rpcUrls[0] as unknown

  if (typeof firstRpcUrl !== 'string' || firstRpcUrl.length === 0) {
    return undefined
  }

  const rpcUrl = firstRpcUrl

  const chain = chainById.get(chainId)

  if (!chain) {
    return undefined
  }

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
  })

  try {
    const balance = await client.getBalance({
      address: treasuryAddress,
    })

    balanceCache.set(cacheKey, balance)
    return balance
  } catch (error) {
    logger.error(
      {
        chainId,
        error: error instanceof Error ? error.message : String(error),
        treasuryAddress,
      },
      'Failed to fetch treasury balance.',
    )
    return undefined
  }
}

/**
 * Builds warning text for each proposal keyed by proposal id.
 * @param proposals - Proposals to evaluate.
 * @param currentUnixTimestamp - Current unix timestamp in seconds.
 * @returns Map of proposal id to warning string.
 */
async function buildProposalWarnings(
  proposals: Proposal[],
  currentUnixTimestamp: number,
): Promise<Map<string, string>> {
  const warnings = new Map<string, string>()
  const balanceCache = new Map<string, bigint>()

  for (const proposal of proposals) {
    const proposalState = deriveProposalState(proposal, currentUnixTimestamp)
    const treasuryBalance = await getTreasuryBalance(proposal, balanceCache)
    const warning = getProposalWarning({
      proposer: proposal.proposer,
      proposalState,
      proposalValues: proposal.values,
      treasuryBalance,
      daoName: proposal.dao.name,
    })

    warnings.set(proposal.id, warning)
  }

  return warnings
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
  const targetDaoIdsSet = options.targetDaoIds
    ? new Set(options.targetDaoIds.map((value) => value.toLowerCase()))
    : undefined
  const targetChainsSet = options.targetChains
    ? new Set(options.targetChains.map((value) => value.toLowerCase()))
    : undefined

  if (targetDaoIdsSet && targetDaoIdsSet.size > 0) {
    if (!targetDaoIdsSet.has(daoId)) {
      return false
    }
  }

  if (targetChainsSet && targetChainsSet.size > 0) {
    if (!targetChainsSet.has(chainName)) {
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
 * @param proposalWarnings - Warning text keyed by proposal id.
 * @param cacheKeyPrefix - Cache key prefix for notified proposal ids.
 * @param options - Optional targeting configuration.
 */
async function notifyFollowersForProposals(
  followers: number[],
  followerDaosMap: Record<number, string[]>,
  proposals: Proposal[],
  proposalWarnings: Map<string, string>,
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
    const notifiedProposals = (await getCache<string[]>(cacheKey)) ?? []

    const notifiedProposalsSet = new Set(notifiedProposals)

    for (const proposal of proposals) {
      const proposalDaoKey = `${proposal.dao.id.toLowerCase()}:${proposal.dao.chain.id.toString()}`

      if (!daos.includes(proposalDaoKey)) {
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
          warning: proposalWarnings.get(proposal.id),
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

    const filteredProposals = activeProposals.filter((proposal) =>
      matchesProposalTargets(proposal, options),
    )

    if (filteredProposals.length === 0) {
      logger.info(
        'No proposals matched targeting filters, terminating execution.',
      )
      return
    }

    const currentUnixTimestamp = DateTime.now().toSeconds()
    const { endingProposals, votingProposals } = splitProposalBuckets(
      filteredProposals,
      currentUnixTimestamp,
    )
    const proposalWarnings = await buildProposalWarnings(
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
      proposalWarnings,
      'notified_voting_proposals',
      options,
    )

    await notifyFollowersForProposals(
      scopedFollowers,
      followerDaosMap,
      endingProposals,
      proposalWarnings,
      'notified_ending_proposals',
      options,
    )
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        { message: error.message, stack: error.stack },
        'Error executing async function',
      )
      throw error
    } else {
      logger.error({ error }, 'Unknown error occurred')
      throw new Error(String(error))
    }
  }
}
