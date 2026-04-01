import { runBuilderRequestWithRetry } from '@/services/builder/request'
import {
  MessageType,
  Propdate,
  PropdateMessage,
  PropdateObject,
} from '@/services/builder/types'
import { propdateChainEndpoints } from '@/services/eas'
import { fetchFromURL } from '@/services/eas/ipfs'
import { gql, GraphQLClient } from 'graphql-request'
import { DateTime } from 'luxon'
import pLimit from 'p-limit'
import { flatMap, pipe } from 'remeda'
import { Hex, zeroHash } from 'viem'

interface Data {
  proposalUpdates: {
    id: Hex
    creator: string
    messageType: number
    message: string
    originalMessageId: Hex
    timestamp: string
    transactionHash: Hex
    proposal: {
      proposalId: Hex
      dao: {
        tokenAddress: string
      }
    }
  }[]
}

interface Result {
  propdates: Propdate[]
}

/**
 * Identifies fetch/network safety failures that should be retried upstream.
 * @param error - Unknown thrown error.
 * @returns True when the error comes from URL fetch/network safety checks.
 */
function isFetchPayloadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes('Failed to fetch from URL') ||
    error.message.includes('Blocked private-network') ||
    error.message.includes('Unsupported URI')
  )
}

export const getPropdateAttestations = async (): Promise<Result> => {
  try {
    const limit = pLimit(10)

    const oneDayAgoInSeconds = Math.floor(
      DateTime.now().minus({ hours: 24 }).toSeconds(),
    )
    const toTimestamp = Math.floor(DateTime.now().toSeconds())

    const query = gql`
      query recentPropdates(
        $fromTimestamp: BigInt!
        $toTimestamp: BigInt!
        $zeroHash: Bytes!
        $first: Int!
        $skip: Int!
      ) {
        proposalUpdates(
          where: {
            timestamp_gte: $fromTimestamp
            timestamp_lte: $toTimestamp
            deleted: false
            originalMessageId: $zeroHash
          }
          orderBy: timestamp
          orderDirection: desc
          first: $first
          skip: $skip
        ) {
          id
          creator
          messageType
          message
          originalMessageId
          timestamp
          transactionHash
          proposal {
            proposalId
            dao {
              tokenAddress
            }
          }
        }
      }
    `

    const variables = {
      fromTimestamp: oneDayAgoInSeconds.toString(),
      toTimestamp: toTimestamp.toString(),
      zeroHash,
    }
    const pageSize = 1000

    const perChainPropdates: Propdate[][] = []

    for (const { chain, endpoint } of propdateChainEndpoints) {
      try {
        const client = new GraphQLClient(endpoint)
        const chainPropdates: Propdate[] = []
        let skip = 0
        let hasMore = true

        while (hasMore) {
          const response = await runBuilderRequestWithRetry(
            async () =>
              client.request<Data>(query, {
                ...variables,
                first: pageSize,
                skip,
              }),
            `get-propdates chain=${chain.name} skip=${skip.toString()}`,
          )

          const pagePropdates = await Promise.all(
            response.proposalUpdates.map(async (update) => {
              const propdateObject = await limit(() =>
                convertPropdateToObject(
                  update.messageType,
                  update.message,
                  update.proposal.proposalId,
                  update.originalMessageId,
                ),
              )

              return {
                ...propdateObject,
                chain,
                id: update.id,
                recipient: update.proposal.dao.tokenAddress,
                timeCreated: Number(update.timestamp),
              }
            }),
          )

          chainPropdates.push(
            ...pagePropdates.filter(
              (propdate) => propdate.proposalId !== zeroHash,
            ),
          )

          hasMore = response.proposalUpdates.length === pageSize
          skip += response.proposalUpdates.length
        }

        perChainPropdates.push(chainPropdates)
      } catch (error) {
        console.error(
          `Error fetching propdates for chain=${chain.name} endpoint=${endpoint}:`,
          error,
        )
      }
    }

    const propdates = pipe(
      perChainPropdates,
      flatMap((chainPropdates) => chainPropdates),
    )

    return { propdates }
  } catch (error) {
    console.error('Error fetching propdates:', error)
    throw error
  }
}

/**
 * Converts raw proposal update fields into a Propdate object.
 * @param messageType - Encoded message type.
 * @param message - Encoded or inline message.
 * @param proposalId - Related proposal ID.
 * @param originalMessageId - Original message reference.
 * @returns Parsed propdate object.
 */
async function convertPropdateToObject(
  messageType: number,
  message: string,
  proposalId: Hex,
  originalMessageId: Hex,
): Promise<PropdateObject> {
  try {
    const result: PropdateObject = {
      message,
      messageType: Number(messageType) as MessageType,
      originalMessageId,
      parsedMessage: { content: '' },
      proposalId,
    }

    switch (result.messageType) {
      case MessageType.INLINE_JSON:
        result.parsedMessage = JSON.parse(result.message) as PropdateMessage
        break
      case MessageType.URL_JSON: {
        const response = await fetchFromURL(result.message)

        try {
          result.parsedMessage = JSON.parse(response) as PropdateMessage
        } catch {
          result.parsedMessage = { content: response } as PropdateMessage
        }
        break
      }
      case MessageType.URL_TEXT: {
        const response = await fetchFromURL(result.message)
        result.parsedMessage = { content: response } as PropdateMessage
        break
      }
      default:
        result.parsedMessage = { content: result.message } as PropdateMessage
        break
    }

    return result
  } catch (error) {
    if (isFetchPayloadError(error)) {
      throw error
    }

    console.error('Error parsing propdate payload:', error)

    return {
      message,
      messageType: MessageType.INLINE_TEXT,
      originalMessageId,
      parsedMessage: { content: message },
      proposalId,
    }
  }
}
