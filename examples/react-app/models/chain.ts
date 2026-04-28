import { z } from "zod";

export const Chain = {
  TON: "ton",
  BASE: "base",
  POLYGON: "polygon",
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
};

export const EVM_CHAINS = [Chain.BASE, Chain.POLYGON] as const;

export function isEvmChain(
  // this type allows for string literals that are not in the Chain enum,
  //  which is useful for passing unknown/unsupported chains without TypeScript errors
  chain: Chain | (string & {}),
): boolean {
  return EVM_CHAINS.includes(chain);
}
