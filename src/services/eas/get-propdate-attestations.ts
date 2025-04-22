import {
  Attestation,
  AttestationJsonData,
  MessageType,
  Propdate,
  PropdateMessage,
  PropdateObject,
} from '@/services/builder/types'
import { attestationChainEndpoints } from '@/services/eas'
import { fetchFromURL } from '@/services/eas/ipfs'
import { gql, GraphQLClient } from 'graphql-request'
import { DateTime } from 'luxon'
import { flatMap, pipe } from 'remeda'
import { Hex, zeroHash } from 'viem'

interface Data {
  attestations: Attestation[]
}

interface Result {
  propdates: Propdate[]
}

export const getPropdateAttestations = async (): Promise<Result> => {
  try {
    const oneDayAgoInSeconds = Math.floor(
      DateTime.now().minus({ hours: 24 }).toSeconds(),
    )

    const propdatesPromises = attestationChainEndpoints.map(
      async ({ chain, endpoint, schemaId }) => {
        const query = gql`
        {
          attestations(
            where: {
              schemaId: {
                equals: "${schemaId}"
              }
              timeCreated:{
                gte: ${oneDayAgoInSeconds}
              }
              isOffchain: {
                equals: false
              }
            }
          ) {
            id
            recipient
            timeCreated
            decodedDataJson
          }
        }
      `

        const client = new GraphQLClient(endpoint)
        const response = await client.request<Data>(query)
        const propdates = await Promise.all(
          response.attestations.map(async (attestation) => {
            const propdateObject = await convertPropdateJsonToObject(
              attestation.decodedDataJson,
            )

            return {
              ...propdateObject,
              id: attestation.id,
              recipient: attestation.recipient,
              timeCreated: attestation.timeCreated,
              chain,
            }
          }),
        )
        return propdates.filter(
          (propdate) =>
            propdate.proposalId !== zeroHash &&
            propdate.originalMessageId === zeroHash, // filter out any reply propdates
        )
      },
    )
    const results = await Promise.all(propdatesPromises)

    const propdates = pipe(
      results,
      flatMap((propdates) => propdates),
    )
    return { propdates }
  } catch (error) {
    console.error('Error fetching attestations:', error)
    throw error
  }
}

/**
 * Converts a JSON string into an Propdate object
 * @param jsonString - The JSON string containing attestation decodedDataJson
 * @returns An object with proposalId, messageType, originalMessageId, and message
 */
async function convertPropdateJsonToObject(
  jsonString: string,
): Promise<PropdateObject> {
  try {
    const parsed = JSON.parse(jsonString) as AttestationJsonData[]
    const result = parsed.reduce(
      (acc: Partial<PropdateObject>, item: AttestationJsonData) => {
        const name = item.name
        const value = item.value.value
        switch (name) {
          case 'messageType':
            acc.messageType = Number(value) as MessageType
            break
          case 'proposalId':
          case 'originalMessageId':
            acc[name] = String(value) as Hex
            break
          case 'message':
            acc.message = String(value)
            break
        }
        return acc
      },
      {},
    ) as PropdateObject

    switch (result.messageType) {
      case MessageType.INLINE_JSON:
        result.parsedMessage = JSON.parse(result.message) as PropdateMessage
        break
      case MessageType.URL_JSON:
        {
          const response = await fetchFromURL(result.message)
          result.parsedMessage = JSON.parse(response) as PropdateMessage
        }
        break
      case MessageType.URL_TEXT:
        {
          const response = await fetchFromURL(result.message)
          result.parsedMessage = { content: response } as PropdateMessage
        }
        break
      default:
        result.parsedMessage = { content: result.message } as PropdateMessage
        break
    }

    return result
  } catch (error) {
    console.error('Error parsing JSON:', error)
    // Return default Attestation object with empty/zero values
    return {
      proposalId: zeroHash,
      originalMessageId: zeroHash,
      message: '',
      messageType: MessageType.INLINE_TEXT,
      parsedMessage: { content: '' },
    }
  }
}
