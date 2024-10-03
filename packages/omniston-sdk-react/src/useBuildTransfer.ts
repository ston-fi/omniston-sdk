import type {
  TransactionResponse,
  TransactionRequest,
} from "@ston-fi/omniston-sdk";
import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.buildTransfer} method to use with react-query.
 */
export function useBuildTransfer(
  request: TransactionRequest,
  queryOptions?: Omit<
    UseQueryOptions<TransactionResponse>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<TransactionResponse> {
  const omniston = useOmniston();

  return useQuery({
    ...queryOptions,
    queryKey: ["buildTransfer", request],
    queryFn: () => omniston.buildTransfer(request),
  });
}
