import type { AssetId } from "@ston-fi/omniston-sdk-react";

import { Chain, type EvmChain } from "./chain";

type AssetMeta = {
  decimals: number;
  symbol?: string;
  displayName?: string;
  imageUrl?: string;
};

type TonAssetExtra = {};

type EvmAssetExtra = {};

type BlockchainExtraMap = {
  [Chain.TON]: TonAssetExtra;
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
