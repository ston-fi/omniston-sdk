import type {
  BuildTonEscrowTransferRequest,
  OmnistonError,
  TonTransaction,
} from "@ston-fi/omniston-sdk";
import { type UseQueryOptions, type UseQueryResult, useQuery } from "@tanstack/react-query";

import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.tonBuildEscrowTransfer} method to use with react-query.
 */
export function useTonBuildEscrowTransfer(
  request: BuildTonEscrowTransferRequest,
  queryOptions?: Omit<UseQueryOptions<TonTransaction, OmnistonError>, "queryKey" | "queryFn">,
): UseQueryResult<TonTransaction, OmnistonError> {
  const omniston = useOmniston();

  return useQuery({
    ...queryOptions,
    queryKey: ["tonBuildEscrowTransfer", request],
    queryFn: () => omniston.tonBuildEscrowTransfer(request),
  });
}
