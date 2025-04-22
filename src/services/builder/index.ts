import { env } from '@/config'
import { Chain } from '@/services/builder/types'

export const chains: Chain[] = [
  {
    id: 1,
    name: 'Ethereum',
  },
  {
    id: 10,
    name: 'Optimism',
  },
  {
    id: 8453,
    name: 'Base',
  },
  {
    id: 7777777,
    name: 'Zora',
  },
]

export const endpoints: Record<number, string> = {
  1: env.BUILDER_SUBGRAPH_ETHEREUM_URL,
  10: env.BUILDER_SUBGRAPH_OPTIMISM_URL,
  8453: env.BUILDER_SUBGRAPH_BASE_URL,
  7777777: env.BUILDER_SUBGRAPH_ZORA_URL,
}

export const chainEndpoints = chains.map((chain) => {
  const endpoint: string | undefined = endpoints[chain.id]
  if (!endpoint) {
    throw new Error(`Endpoint not found for chain ID: ${chain.id.toString()}`)
  }
  return {
    chain,
    endpoint,
  }
})
