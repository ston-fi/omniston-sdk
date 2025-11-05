import type {
  EscrowOrderListRequest,
  EscrowOrderListResponse,
  OmnistonError,
} from "@ston-fi/omniston-sdk";
import {
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";

import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.escrowList} method to use with react-query.
 */
export function useEscrowList(
  request: EscrowOrderListRequest,
  queryOptions?: Omit<
    UseQueryOptions<EscrowOrderListResponse, OmnistonError>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<EscrowOrderListResponse, OmnistonError> {
  const omniston = useOmniston();

  return useQuery({
    ...queryOptions,
    queryKey: ["escrowList", request],
    queryFn: () => omniston.escrowList(request),
  });
}
