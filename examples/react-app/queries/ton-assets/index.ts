import { queryOptions } from "@tanstack/react-query";
import type { AssetId, ChainAddress } from "@ston-fi/omniston-sdk-react";

import type { Asset } from "@/models/asset";
import { Chain } from "@/models/chain";

import { fetchTonAssets } from "./fetch-ton-assets-action";
import { searchTonAssets } from "./search-ton-assets-action";

const TON_ASSETS_QUERY_KEY = "ton-assets";
const TON_ASSETS_SEARCH_QUERY_KEY = "ton-assets-search";

export const tonAssetQueryFactory = {
  fetch: ({
    condition,
    unconditionalAssets,
    walletAddress,
  }: {
    condition?: string;
    unconditionalAssets?: AssetId[];
    walletAddress?: ChainAddress;
  }) => {
    return queryOptions({
      queryKey: [TON_ASSETS_QUERY_KEY, walletAddress, condition, unconditionalAssets],
      queryFn: async () => {
        const assets = await fetchTonAssets({
          condition: condition ? condition : undefined,
          unconditionalAssets: unconditionalAssets?.reduce<string[]>((acc, assetId) => {
            if (assetId.chain.$case === Chain.TON && assetId.chain.value.kind.$case === "jetton") {
              acc.push(assetId.chain.value.kind.value);
            }

            return acc;
          }, []),
          walletAddress:
            walletAddress?.chain.$case === Chain.TON ? walletAddress.chain.value : undefined,
        });

        const sortedAssets = sortAssets(assets);

        return sortedAssets;
      },
    });
  },
  search: ({
    searchTerms,
    condition,
    unconditionalAssets,
    walletAddress,
  }: {
    searchTerms: string[];
    condition?: string;
    unconditionalAssets?: AssetId[];
    walletAddress?: ChainAddress;
  }) => {
    return queryOptions({
      queryKey: [
        TON_ASSETS_SEARCH_QUERY_KEY,
        searchTerms,
        walletAddress,
        condition,
        unconditionalAssets,
      ],
      queryFn: async () => {
        const assets = await searchTonAssets({
          searchTerms,
          condition: condition ? condition : undefined,
          unconditionalAssets: unconditionalAssets?.reduce<string[]>((acc, assetId) => {
            if (assetId.chain.$case === Chain.TON && assetId.chain.value.kind.$case === "jetton") {
              acc.push(assetId.chain.value.kind.value);
            }

            return acc;
          }, []),
          walletAddress:
            walletAddress?.chain.$case === Chain.TON ? walletAddress.chain.value : undefined,
        });

        const sortedAssets = sortAssets(assets);

        return sortedAssets;
      },
    });
  },
};

function sortAssets(assets: Asset[]) {
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
