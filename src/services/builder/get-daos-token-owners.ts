import { gql, GraphQLClient } from 'graphql-request'
import { JsonObject } from 'type-fest'
import { chainEndpoints } from './index'
import { Env, Owner } from './types'

type Data = {
  owners: Owner[] | null
} & JsonObject

interface Result {
  owners: Owner[]
}

/**
 * Fetches DAO token owners from multiple subgraphs.
 *
 * This asynchronous function queries several subgraph endpoints -- Ethereum, Base, Optimism, and Zora --
 * to retrieve and aggregate a list of all DAO token owners.
 * @param env - The environment object containing subgraph URLs.
 * @param [skip] - The number of records to skip (for pagination).
 * @param [first] - The number of records to retrieve (for pagination).
 * @returns A promise that resolves to a result object containing an array of DAO token owners.
 * @throws Will throw an error if the subgraph requests fail.
 */
export const getDAOsTokenOwners = async (
  env: Env,
  skip = 0,
  first = 1000,
): Promise<Result> => {
  let allOwners: Owner[] = []

  const query = gql`
    query GetDAOTokenOwners($skip: Int!, $first: Int!) {
      owners: daotokenOwners(
        skip: $skip
        first: $first
        orderBy: daoTokenCount
        orderDirection: desc
        subgraphError: deny
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
    for (const { chain, endpoint } of chainEndpoints) {
      let currentSkip = skip
      let hasMore = true
      while (hasMore) {
        const client = new GraphQLClient(endpoint)
        const response = await client.request<Data>(query, {
          skip: currentSkip,
          first,
        })
        const owners = response.owners ?? []
        if (owners.length === 0) {
          hasMore = false
        } else {
          allOwners = [
            ...allOwners,
            ...(owners.map((owner) => ({
              ...owner,
              dao: {
                ...owner.dao,
                chain,
              },
            })) as Owner[]),
          ]
          currentSkip += owners.length
        }
      }
    }

    return { owners: allOwners }
  } catch (error) {
    console.error('Error fetching DAO token owners across chains:', error)
    throw error
  }
}
