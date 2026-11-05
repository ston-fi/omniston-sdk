import type { AssetId } from "@ston-fi/omniston-sdk-react";

import { Chain } from "./chain";
import type { EvmChain } from "./chain-family";

type AssetMeta = {
  decimals: number;
  symbol?: string;
  displayName?: string;
  imageUrl?: string;
};

type TonAssetExtra = {};

type EvmAssetExtra = {};

type TronAssetExtra = {};

type BlockchainExtraMap = {
  [Chain.TON]: TonAssetExtra;
  [Chain.TRON]: TronAssetExtra;
} & Record<EvmChain, EvmAssetExtra>;

export type Asset = {
  [K in Chain]: {
    id: Omit<AssetId, "chain"> & {
      chain: Extract<AssetId["chain"], { $case: K }>;
    };
    metadata: AssetMeta;
    balance?: bigint;
    priceUsd?: number;
    extra: BlockchainExtraMap[K];
  };
}[Chain];

/**
 * Orders assets to help users find relevant tokens when choosing what to swap.
 */
export function sortAssetsForSelection(assets: Asset[]) {
  return assets.sort((a, b) => {
    const aBalance = a.balance ?? 0n;
    const bBalance = b.balance ?? 0n;

    if (aBalance > 0n && !(bBalance > 0n)) return -1;
    if (bBalance > 0n && !(aBalance > 0n)) return 1;

    const aAmountUSD = a.priceUsd ? a.priceUsd * Number(aBalance) : undefined;
    const bAmountUSD = b.priceUsd ? b.priceUsd * Number(bBalance) : undefined;

    if (aAmountUSD && !bAmountUSD) return -1;
    if (!aAmountUSD && bAmountUSD) return 1;

    if (aAmountUSD && bAmountUSD) {
      return bAmountUSD - aAmountUSD;
    }

    if (aBalance > bBalance) return -1;
    if (aBalance < bBalance) return 1;

    if (a.metadata.symbol && b.metadata.symbol) {
      return a.metadata.symbol.localeCompare(b.metadata.symbol);
    }

    return 0;
  });
}
