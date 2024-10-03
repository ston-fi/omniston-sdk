import type { AssetsResponse } from "@ston-fi/omniston-sdk";
import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.assetList} method to use with react-query.
 */
export function useAssetList(
  queryOptions?: Omit<UseQueryOptions<AssetsResponse>, "queryKey" | "queryFn">,
): UseQueryResult<AssetsResponse> {
  const omniston = useOmniston();

  return useQuery({
    staleTime: 300_000, // 5 minutes by default
    ...queryOptions,
    queryKey: ["assetList"],
    queryFn: () => omniston.assetList(),
  });
}
