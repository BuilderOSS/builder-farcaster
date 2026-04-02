import { PUBLIC_SUBGRAPH_URL } from '@buildeross/constants'
import { CHAIN_ID } from '@buildeross/types'
import { env } from '../../config'
import { parseBooleanEnv } from '../../flags'
import { Chain } from './types'

const allChains: Chain[] = [
  {
    id: CHAIN_ID.ETHEREUM,
    name: 'Ethereum',
  },
  {
    id: CHAIN_ID.OPTIMISM,
    name: 'Optimism',
  },
  {
    id: CHAIN_ID.BASE,
    name: 'Base',
  },
  {
    id: CHAIN_ID.ZORA,
    name: 'Zora',
  },
  {
    id: CHAIN_ID.SEPOLIA,
    isTestnet: true,
    name: 'Sepolia',
  },
  {
    id: CHAIN_ID.OPTIMISM_SEPOLIA,
    isTestnet: true,
    name: 'Optimism Sepolia',
  },
  {
    id: CHAIN_ID.BASE_SEPOLIA,
    isTestnet: true,
    name: 'Base Sepolia',
  },
  {
    id: CHAIN_ID.ZORA_SEPOLIA,
    isTestnet: true,
    name: 'Zora Sepolia',
  },
]

const includeTestnetChains =
  env.NODE_ENV !== 'production' ||
  parseBooleanEnv(env.ENABLE_TESTNET_CHAINS, false)

export const chains = allChains.filter((chain) =>
  includeTestnetChains ? true : chain.isTestnet !== true,
)

export const chainEndpoints = chains.map((chain) => {
  const endpoint = PUBLIC_SUBGRAPH_URL.get(chain.id)

  if (!endpoint) {
    throw new Error(`Endpoint not found for chain ID: ${chain.id.toString()}`)
  }

  return {
    chain,
    endpoint,
  }
})
