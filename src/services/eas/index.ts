import { EAS_SUPPORTED_CHAIN_IDS } from '@buildeross/constants'

import { chainEndpoints } from '@/services/builder'

const easSupportedChainIds = new Set(
  EAS_SUPPORTED_CHAIN_IDS.map((chainId) => chainId),
)

export const propdateChainEndpoints = chainEndpoints.filter(({ chain }) =>
  easSupportedChainIds.has(chain.id),
)
