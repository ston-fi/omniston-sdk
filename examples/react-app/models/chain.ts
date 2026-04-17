import { z } from "zod";

export const Chain = {
  TON: "ton",
  BASE: "base",
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
};
