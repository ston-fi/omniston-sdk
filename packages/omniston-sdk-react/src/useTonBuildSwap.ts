import type { BuildTonSwapRequest, OmnistonError, TonTransaction } from "@ston-fi/omniston-sdk";
import { type UseQueryOptions, type UseQueryResult, useQuery } from "@tanstack/react-query";

import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.tonBuildSwap} method to use with react-query.
 */
export function useTonBuildSwap(
  request: BuildTonSwapRequest,
  queryOptions?: Omit<UseQueryOptions<TonTransaction, OmnistonError>, "queryKey" | "queryFn">,
): UseQueryResult<TonTransaction, OmnistonError> {
  const omniston = useOmniston();

  return useQuery({
    ...queryOptions,
    queryKey: ["tonBuildSwap", request],
    queryFn: () => omniston.tonBuildSwap(request),
  });
}
