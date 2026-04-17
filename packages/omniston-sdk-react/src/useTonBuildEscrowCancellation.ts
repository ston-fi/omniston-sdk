import type {
  BuildTonEscrowCancellationRequest,
  OmnistonError,
  TonTransaction,
} from "@ston-fi/omniston-sdk";
import { type UseQueryOptions, type UseQueryResult, useQuery } from "@tanstack/react-query";

import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.tonBuildEscrowCancellation} method to use with react-query.
 */
export function useTonBuildEscrowCancellation(
  request: BuildTonEscrowCancellationRequest,
  queryOptions?: Omit<UseQueryOptions<TonTransaction, OmnistonError>, "queryKey" | "queryFn">,
): UseQueryResult<TonTransaction, OmnistonError> {
  const omniston = useOmniston();

  return useQuery({
    ...queryOptions,
    queryKey: ["tonBuildEscrowCancellation", request],
    queryFn: () => omniston.tonBuildEscrowCancellation(request),
  });
}
