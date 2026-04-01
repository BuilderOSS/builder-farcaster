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

export const getPropdateAttestations = async (): Promise<Result> => {
  try {
    const oneDayAgoInSeconds = Math.floor(
      DateTime.now().minus({ hours: 24 }).toSeconds(),
    )

    const query = gql`
      query recentPropdates(
        $fromTimestamp: BigInt!
        $zeroHash: Bytes!
        $first: Int!
        $skip: Int!
      ) {
        proposalUpdates(
          where: {
            timestamp_gte: $fromTimestamp
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
      zeroHash,
    }
    const pageSize = 1000

    const perChainPropdates: Propdate[][] = []

    for (const { chain, endpoint } of propdateChainEndpoints) {
      const client = new GraphQLClient(endpoint)
      const updates: Data['proposalUpdates'] = []
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

        updates.push(...response.proposalUpdates)
        hasMore = response.proposalUpdates.length === pageSize
        skip += response.proposalUpdates.length
      }

      const propdates = await Promise.all(
        updates.map(async (update) => {
          const propdateObject = await convertPropdateToObject(
            update.messageType,
            update.message,
            update.proposal.proposalId,
            update.originalMessageId,
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

      perChainPropdates.push(
        propdates.filter(
          (propdate) =>
            propdate.proposalId !== zeroHash &&
            propdate.originalMessageId === zeroHash,
        ),
      )
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
        result.parsedMessage = JSON.parse(response) as PropdateMessage
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
