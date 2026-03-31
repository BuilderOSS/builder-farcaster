import { chainEndpoints } from '@/services/builder/index'
import { runBuilderRequestWithRetry } from '@/services/builder/request'
import { Dao, Env, Owner } from '@/services/builder/types'
import { gql, GraphQLClient } from 'graphql-request'
import { pipe, uniqueBy } from 'remeda'
import { JsonObject } from 'type-fest'

type Data = {
  owners: Owner[]
} & JsonObject

interface Result {
  daos: Dao[]
  ownerDaoIdsMap: Record<string, string[]>
}

const OWNER_CHUNK_SIZE = 75

/**
 * Splits addresses into fixed-size chunks.
 * @param addresses - Owner addresses.
 * @param size - Maximum chunk size.
 * @returns Chunks of addresses.
 */
function chunkAddresses(addresses: string[], size: number): string[][] {
  const chunks: string[][] = []

  for (let index = 0; index < addresses.length; index += size) {
    chunks.push(addresses.slice(index, index + size))
  }

  return chunks
}

/**
 * Resolves DAO memberships for a set of owner addresses across supported chains.
 * @param _env - Unused environment object kept for call-site compatibility.
 * @param ownerAddresses - Owner addresses to resolve.
 * @returns Unique DAOs and owner-to-dao mapping.
 */
export const getDAOsForOwners = async (
  _env: Env,
  ownerAddresses: string[],
): Promise<Result> => {
  const normalizedAddresses = [
    ...new Set(ownerAddresses.map((address) => address.toLowerCase())),
  ]

  if (normalizedAddresses.length === 0) {
    return {
      daos: [],
      ownerDaoIdsMap: {},
    }
  }

  const query = gql`
    query GetDaosForOwners($ownerAddresses: [String!]) {
      owners: daotokenOwners(
        skip: 0
        first: 1000
        where: { owner_in: $ownerAddresses }
      ) {
        id
        owner
        dao {
          id
          name
          ownerCount
        }
        daoTokenCount
      }
    }
  `

  try {
    const allOwners: Owner[] = []

    for (const { chain, endpoint } of chainEndpoints) {
      const client = new GraphQLClient(endpoint)
      const ownerChunks = chunkAddresses(normalizedAddresses, OWNER_CHUNK_SIZE)

      for (const ownerChunk of ownerChunks) {
        const response = await runBuilderRequestWithRetry(
          async () =>
            client.request<Data>(query, {
              ownerAddresses: ownerChunk,
            }),
          `get-daos-for-owners chain=${chain.name} chunkSize=${String(ownerChunk.length)}`,
        )

        allOwners.push(
          ...response.owners.map((owner) => ({
            ...owner,
            owner: owner.owner.toLowerCase(),
            dao: {
              ...owner.dao,
              chain,
            },
          })),
        )
      }
    }

    const uniqueDaos = pipe(
      allOwners.map((owner) => owner.dao),
      uniqueBy((dao) => dao.id),
    )

    const ownerDaoIdsMap: Record<string, string[]> = {}
    for (const owner of allOwners) {
      const ownerAddress = owner.owner.toLowerCase()
      ownerDaoIdsMap[ownerAddress] ??= []
      if (!ownerDaoIdsMap[ownerAddress].includes(owner.dao.id.toLowerCase())) {
        ownerDaoIdsMap[ownerAddress].push(owner.dao.id.toLowerCase())
      }
    }

    return { daos: uniqueDaos, ownerDaoIdsMap }
  } catch (error) {
    console.error('Error fetching DAO token owners:', error)
    throw error
  }
}
