import { Chain, type EvmChain } from "@/models/chain";

const chainToChainIdMap = {
  [Chain.ETHEREUM]: 1,
  [Chain.POLYGON]: 137,
  [Chain.BASE]: 8453,
} as const satisfies Record<EvmChain, number>;

export type EvmChainId = (typeof chainToChainIdMap)[EvmChain];

const chainIdToChainMap = {
  1: Chain.ETHEREUM,
  137: Chain.POLYGON,
  8453: Chain.BASE,
} as const satisfies Record<EvmChainId, EvmChain>;

export function mapChainIdToChain(chainId: EvmChainId): EvmChain {
  return chainIdToChainMap[chainId];
}

export function mapChainToChainId(chain: EvmChain): EvmChainId {
  return chainToChainIdMap[chain];
}
