import type {
  OmnistonError,
  TonEscrowVaultBalancesRequest,
  TonEscrowVaultBalancesResponse,
} from "@ston-fi/omniston-sdk";
import { type UseQueryOptions, type UseQueryResult, useQuery } from "@tanstack/react-query";

import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.tonGetEscrowVaultBalances} method to use with react-query.
 */
export function useTonEscrowVaultBalances(
  request: TonEscrowVaultBalancesRequest,
  queryOptions?: Omit<
    UseQueryOptions<TonEscrowVaultBalancesResponse, OmnistonError>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<TonEscrowVaultBalancesResponse, OmnistonError> {
  const omniston = useOmniston();

  return useQuery({
    ...queryOptions,
    queryKey: ["tonGetEscrowVaultBalances", request],
    queryFn: () => omniston.tonGetEscrowVaultBalances(request),
  });
}
