import { z } from "zod";

export const Chain = {
  ARBITRUM: "arbitrum",
  AVALANCHE: "avalanche",
  BASE: "base",
  BNB: "bnb",
  ETHEREUM: "ethereum",
  POLYGON: "polygon",
  ROBINHOOD: "robinhood",
  TON: "ton",
  TRON: "tron",
} as const;

export type Chain = (typeof Chain)[keyof typeof Chain];

export const chainSchema = z.enum(Chain);

type ChainMetadata = {
  label: string;
  imageUrl: string;
};

export const CHAIN_METADATA: Record<Chain, ChainMetadata> = {
  [Chain.ARBITRUM]: {
    label: "ARBITRUM",
    imageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png",
  },
  [Chain.AVALANCHE]: {
    label: "AVALANCHE",
    imageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png",
  },
  [Chain.BASE]: {
    label: "BASE",
    imageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/27716.png",
  },
  [Chain.BNB]: {
    label: "BNB",
    imageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
  },
  [Chain.ETHEREUM]: {
    label: "ETHEREUM",
    imageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  },
  [Chain.POLYGON]: {
    label: "POLYGON",
    imageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/28321.png",
  },
  [Chain.ROBINHOOD]: {
    label: "ROBINHOOD",
    imageUrl: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/909.png",
  },
  [Chain.TON]: {
    label: "TON",
    imageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/11419.png",
  },
  [Chain.TRON]: {
    label: "TRON",
    imageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png",
  },
};
