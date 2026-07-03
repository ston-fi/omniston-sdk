import { Chain, type EvmChain } from "@/models/chain";

const chainToChainIdMap = {
  [Chain.ARBITRUM]: 42161,
  [Chain.AVALANCHE]: 43114,
  [Chain.BASE]: 8453,
  [Chain.BNB]: 56,
  [Chain.ETHEREUM]: 1,
  [Chain.POLYGON]: 137,
} as const satisfies Record<EvmChain, number>;

export type EvmChainId = (typeof chainToChainIdMap)[EvmChain];

const chainIdToChainMap = {
  42161: Chain.ARBITRUM,
  43114: Chain.AVALANCHE,
  8453: Chain.BASE,
  56: Chain.BNB,
  1: Chain.ETHEREUM,
  137: Chain.POLYGON,
} as const satisfies Record<EvmChainId, EvmChain>;

export function mapChainIdToChain(chainId: EvmChainId): EvmChain {
  return chainIdToChainMap[chainId];
}

export function mapChainToChainId(chain: EvmChain): EvmChainId {
  return chainToChainIdMap[chain];
}
