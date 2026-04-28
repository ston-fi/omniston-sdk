import type { AssetId } from "@ston-fi/omniston-sdk-react";

import { Chain } from "./chain";

type AssetMeta = {
  decimals: number;
  symbol?: string;
  displayName?: string;
  imageUrl?: string;
};

type TonAssetExtra = {};

type BaseAssetExtra = {};

type PolygonAssetExtra = {};

type BlockchainExtraMap = {
  [Chain.TON]: TonAssetExtra;
  [Chain.BASE]: BaseAssetExtra;
  [Chain.POLYGON]: PolygonAssetExtra;
};

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
