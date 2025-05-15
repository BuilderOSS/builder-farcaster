import { chains } from '@/services/builder'

const attestationEndpoints: Record<number, string> = {
  1: 'https://easscan.org/graphql',
  10: 'https://optimism.easscan.org/graphql',
  8453: 'https://base.easscan.org/graphql',
}

const PROPDATES_SCHEMA_ID =
  '0x8bd0d42901ce3cd9898dbea6ae2fbf1e796ef0923e7cbb0a1cecac2e42d47cb3'

// Filter supported chains and validate endpoints
const supportedChains = chains.filter((chain) => chain.id !== 7777777); // EAS does not support Zora

export const attestationChainEndpoints = supportedChains
  .map((chain) => {
    const endpoint = attestationEndpoints[chain.id];

    if (!endpoint) {
      console.warn(`Endpoint not found for chain ID: ${chain.id.toString()}. This chain will be skipped.`);
      return null;
    }

    return {
      chain,
      endpoint,
      schemaId: PROPDATES_SCHEMA_ID,
    };
  })
  .filter((config): config is NonNullable<typeof config> => config !== null);
