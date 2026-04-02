import { gql, GraphQLClient } from 'graphql-request'
import { DateTime } from 'luxon'
import { pipe, uniqueBy } from 'remeda'
import { JsonObject } from 'type-fest'
import { chainEndpoints } from './index'
import { runBuilderRequestWithRetry } from './request'
import { Proposal } from './types'

type Data = {
  proposals: Proposal[]
} & JsonObject

interface Result {
  proposals: Proposal[]
}

export const getActiveProposals = async (): Promise<Result> => {
  const currentTimeInSeconds = Math.floor(DateTime.now().toSeconds())

  const query = gql`
    {
      proposals(
        skip: 0
        first: 100
        orderBy: timeCreated
        orderDirection: asc
        where: {
          voteEnd_gt: ${currentTimeInSeconds}
          queued: false
          executed: false
          canceled: false
          vetoed: false
        }
      ) {
        id
        proposalNumber
        dao {
          id
          name
        }
        title
        proposer
        timeCreated
        voteStart
        voteEnd
      }
    }
  `

  try {
    const chainProposalGroups = await Promise.all(
      chainEndpoints.map(async ({ chain, endpoint }) => {
        const client = new GraphQLClient(endpoint)
        const response = await runBuilderRequestWithRetry(
          async () => client.request<Data>(query),
          `get-active-proposals chain=${chain.name}`,
        )

        return response.proposals.map((proposal) => ({
          ...proposal,
          dao: {
            ...proposal.dao,
            chain,
          },
        }))
      }),
    )

    const allProposals = chainProposalGroups.flat()

    const uniqueProposals = pipe(
      allProposals,
      uniqueBy((proposal) => proposal.id),
    )
    return { proposals: uniqueProposals }
  } catch (error) {
    console.error('Error fetching active proposals:', error)
    throw error
  }
}
