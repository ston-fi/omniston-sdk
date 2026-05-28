import { z } from "zod";

export const Chain = {
  TON: "ton",
  BASE: "base",
  POLYGON: "polygon",
  ETHEREUM: "ethereum",
} as const;

export type Chain = (typeof Chain)[keyof typeof Chain];

export const chainSchema = z.enum(Chain);

type ChainMetadata = {
  label: string;
  imageUrl: string;
};

export const CHAIN_METADATA: Record<Chain, ChainMetadata> = {
  [Chain.TON]: {
    label: "TON",
    imageUrl: "https://asset.ston.fi/img/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
  },
  [Chain.BASE]: {
    label: "BASE",
    imageUrl: "https://assets.coingecko.com/asset_platforms/images/131/small/base.png",
  },
  [Chain.POLYGON]: {
    label: "POLYGON",
    imageUrl: "https://assets.coingecko.com/asset_platforms/images/15/small/polygon_pos.png",
  },
  [Chain.ETHEREUM]: {
    label: "ETHEREUM",
    imageUrl: "https://assets.coingecko.com/coins/images/279/standard/ethereum.png",
  },
};

export const EVM_CHAINS = [Chain.BASE, Chain.POLYGON, Chain.ETHEREUM] as const;

export type EvmChain = (typeof EVM_CHAINS)[number];

export function isEvmChain(
  // this type allows for string literals that are not in the Chain enum,
  //  which is useful for passing unknown/unsupported chains without TypeScript errors
  chain: Chain | (string & {}),
): chain is EvmChain {
  return EVM_CHAINS.includes(chain);
}
