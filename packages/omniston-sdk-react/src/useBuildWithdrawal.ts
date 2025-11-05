import type {
  BuildWithdrawalRequest,
  OmnistonError,
  TransactionResponse,
} from "@ston-fi/omniston-sdk";
import {
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";

import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.buildWithdrawal} method to use with react-query.
 */
export function useBuildWithdrawal(
  request: BuildWithdrawalRequest,
  queryOptions?: Omit<
    UseQueryOptions<TransactionResponse, OmnistonError>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<TransactionResponse, OmnistonError> {
  const omniston = useOmniston();

  return useQuery({
    ...queryOptions,
    queryKey: ["buildWithdrawal", request],
    queryFn: () => omniston.buildWithdrawal(request),
  });
}
