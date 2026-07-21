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
