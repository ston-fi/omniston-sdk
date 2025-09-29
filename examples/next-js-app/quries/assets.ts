import { queryOptions } from "@tanstack/react-query";

import { fetchAssets, searchAssets } from "@/lib/assets-actions";

const ASSETS_QUERY_KEY = "assets";
const ASSETS_SEARCH_QUERY_KEY = "assets-search";

export const assetQueryFactory = {
  fetch: ({
    condition,
    unconditionalAssets,
    walletAddress,
  }: {
    condition?: string;
    unconditionalAssets?: string[];
    walletAddress?: string;
  }) => {
    return queryOptions({
      queryKey: [
        ASSETS_QUERY_KEY,
        walletAddress,
        condition,
        unconditionalAssets,
      ],
      queryFn: () =>
        fetchAssets({
          condition,
          unconditionalAssets,
          walletAddress,
        }),
    });
  },
  search: ({
    searchTerm,
    condition,
    unconditionalAssets,
    walletAddress,
  }: {
    searchTerm: string;
    condition?: string;
    unconditionalAssets?: string[];
    walletAddress?: string;
  }) => {
    return queryOptions({
      queryKey: [
        ASSETS_SEARCH_QUERY_KEY,
        searchTerm,
        walletAddress,
        condition,
        unconditionalAssets,
      ],
      queryFn: () =>
        searchAssets({
          searchTerm,
          condition,
          unconditionalAssets,
          walletAddress,
        }),
    });
  },
};
