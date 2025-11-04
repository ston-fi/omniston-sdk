import type {
  BuildTransferRequest,
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
 * Wrapper for {@link Omniston.buildTransfer} method to use with react-query.
 */
export function useBuildTransfer(
  request: BuildTransferRequest,
  queryOptions?: Omit<
    UseQueryOptions<TransactionResponse, OmnistonError>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<TransactionResponse, OmnistonError> {
  const omniston = useOmniston();

  return useQuery({
    ...queryOptions,
    queryKey: ["buildTransfer", request],
    queryFn: () => omniston.buildTransfer(request),
  });
}
