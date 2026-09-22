import { CHAIN_METADATA, Chain } from "~/models/chain";

export const ChainFamily = {
  TON: "ton",
  EVM: "evm",
  TRON: "tron",
} as const;

export type ChainFamily = (typeof ChainFamily)[keyof typeof ChainFamily];

type ChainFamilyMetadata = {
  label: string;
  imageUrl: string;
};

export const CHAIN_FAMILY_METADATA: Record<ChainFamily, ChainFamilyMetadata> = {
  [ChainFamily.TON]: {
    label: "TON",
    imageUrl: CHAIN_METADATA[Chain.TON].imageUrl,
  },
  [ChainFamily.EVM]: {
    label: "EVM",
    imageUrl: CHAIN_METADATA[Chain.ETHEREUM].imageUrl,
  },
  [ChainFamily.TRON]: {
    label: "TRON",
    imageUrl: CHAIN_METADATA[Chain.TRON].imageUrl,
  },
};

export const chainFamilyByChain: Record<Chain, ChainFamily> = {
  [Chain.ARBITRUM]: ChainFamily.EVM,
  [Chain.ARC]: ChainFamily.EVM,
  [Chain.AVALANCHE]: ChainFamily.EVM,
  [Chain.BASE]: ChainFamily.EVM,
  [Chain.BNB]: ChainFamily.EVM,
  [Chain.ETHEREUM]: ChainFamily.EVM,
  [Chain.POLYGON]: ChainFamily.EVM,
  [Chain.ROBINHOOD]: ChainFamily.EVM,
  [Chain.TON]: ChainFamily.TON,
  [Chain.TRON]: ChainFamily.TRON,
  [Chain.XLAYER]: ChainFamily.EVM,
};

export const chainsByFamily = {
  [ChainFamily.TON]: [Chain.TON],
  [ChainFamily.EVM]: [
    Chain.ARBITRUM,
    Chain.ARC,
    Chain.AVALANCHE,
    Chain.BASE,
    Chain.BNB,
    Chain.ETHEREUM,
    Chain.POLYGON,
    Chain.ROBINHOOD,
    Chain.XLAYER,
  ],
  [ChainFamily.TRON]: [Chain.TRON],
} as const satisfies Record<ChainFamily, readonly Chain[]>;

export type ChainInFamily<T extends ChainFamily> = (typeof chainsByFamily)[T][number];

type Assert<T extends true> = T;
// Type-level assertion to ensure that all `Chain` values are present in the `chainsByFamily` mapping.
// If a new chain is added to the `Chain` enum, this will cause a TypeScript error until it is added to the appropriate family in `chainsByFamily`.
// DO NOT REMOVE OR MODIFY
type _ChainsByFamilyCoversAllChains = Assert<
  [Chain] extends [ChainInFamily<ChainFamily>] ? true : false
>;

export type EvmChain = ChainInFamily<typeof ChainFamily.EVM>;

export function getChainFamilyByChain(chain: Chain): ChainFamily {
  return chainFamilyByChain[chain];
}

export function getChainsByFamily<T extends ChainFamily>(
  chainFamily: T,
): readonly ChainInFamily<T>[] {
  return chainsByFamily[chainFamily] as readonly ChainInFamily<T>[];
}

export function isChainInFamily<T extends ChainFamily>(
  chain: Chain,
  chainFamily: T,
): chain is ChainInFamily<T> {
  return (getChainsByFamily(chainFamily) as readonly string[]).includes(chain);
}
