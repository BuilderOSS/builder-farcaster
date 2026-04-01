import { chainEndpoints } from '@/services/builder/index'
import { runBuilderRequestWithRetry } from '@/services/builder/request'
import { Chain, Proposal } from '@/services/builder/types'
import { gql, GraphQLClient } from 'graphql-request'
import { JsonObject } from 'type-fest'

type Data = {
  proposal?: Proposal
} & JsonObject

interface Result {
  proposal: Proposal
}

export const getProposalData = async (
  chain: Chain,
  proposalId: string,
): Promise<Result> => {
  const query = gql`
    query GetProposal($id: ID!) {
      proposal(id: $id) {
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
    const endpoint = chainEndpoints.find(
      (endPoint) => endPoint.chain.id === chain.id,
    )
    if (!endpoint) {
      throw new Error(`Endpoint not found for chain ID: ${chain.id.toString()}`)
    }
    const client = new GraphQLClient(endpoint.endpoint)
    const variables = {
      id: proposalId.toLowerCase(),
    }
    const response = await runBuilderRequestWithRetry(
      async () => client.request<Data>(query, variables),
      `get-proposal-from-id chain=${chain.name} proposalId=${proposalId}`,
    )
    if (!response.proposal) {
      throw new Error(`Proposal does not exist: ${proposalId}`)
    }

    return {
      proposal: {
        ...response.proposal,
        dao: {
          ...response.proposal.dao,
          chain,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching proposal data for proposal update:', error)
    throw error
  }
}
