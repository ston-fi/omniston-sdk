import type {
  BuildEvmOrderCancellationRequest,
  EvmOrderCancellationResponse,
  OmnistonError,
} from "@ston-fi/omniston-sdk";
import { type UseQueryOptions, type UseQueryResult, useQuery } from "@tanstack/react-query";

import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.evmBuildOrderCancellation} method to use with react-query.
 */
export function useEvmBuildOrderCancellation(
  request: BuildEvmOrderCancellationRequest,
  queryOptions?: Omit<
    UseQueryOptions<EvmOrderCancellationResponse, OmnistonError>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<EvmOrderCancellationResponse, OmnistonError> {
  const omniston = useOmniston();

  return useQuery({
    ...queryOptions,
    queryKey: ["evmBuildOrderCancellation", request],
    queryFn: () => omniston.evmBuildOrderCancellation(request),
  });
}
