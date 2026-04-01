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
const SUBGRAPH_PAGE_SIZE = 1000

/**
 * Builds a chain-qualified DAO key.
 * @param dao - DAO object.
 * @returns Stable key per chain.
 */
function getDaoChainKey(dao: Dao): string {
  return `${dao.id.toLowerCase()}:${dao.chain.id.toString()}`
}

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
    query GetDaosForOwners(
      $ownerAddresses: [String!]
      $first: Int!
      $skip: Int!
    ) {
      owners: daotokenOwners(
        skip: $skip
        first: $first
        orderBy: id
        orderDirection: asc
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
        let hasMore = true
        let skip = 0

        while (hasMore) {
          const response = await runBuilderRequestWithRetry(
            async () =>
              client.request<Data>(query, {
                first: SUBGRAPH_PAGE_SIZE,
                ownerAddresses: ownerChunk,
                skip,
              }),
            `get-daos-for-owners chain=${chain.name} chunkSize=${String(ownerChunk.length)} skip=${String(skip)}`,
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

          hasMore = response.owners.length === SUBGRAPH_PAGE_SIZE
          skip += response.owners.length
        }
      }
    }

    const uniqueDaos = pipe(
      allOwners.map((owner) => owner.dao),
      uniqueBy((dao) => getDaoChainKey(dao)),
    )

    const ownerDaoIdsMap: Record<string, string[]> = {}
    for (const owner of allOwners) {
      const ownerAddress = owner.owner.toLowerCase()
      const daoKey = getDaoChainKey(owner.dao)
      ownerDaoIdsMap[ownerAddress] ??= []
      if (!ownerDaoIdsMap[ownerAddress].includes(daoKey)) {
        ownerDaoIdsMap[ownerAddress].push(daoKey)
      }
    }

    return { daos: uniqueDaos, ownerDaoIdsMap }
  } catch (error) {
    console.error('Error fetching DAO token owners:', error)
    throw error
  }
}
