import { chainEndpoints } from '@/services/builder/index'
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
    const response = await client.request<Data>(query, variables)
    if (!response.proposal) {
      throw new Error(`Proposal does not exist: ${proposalId}`)
    }
    return { proposal: response.proposal }
  } catch (error) {
    console.error('Error fetching proposal data for proposal update:', error)
    throw error
  }
}
