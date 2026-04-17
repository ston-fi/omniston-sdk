import type {
  CancelSignedOrderRequest,
  CancelSignedOrderResponse,
  OmnistonError,
} from "@ston-fi/omniston-sdk";
import { type UseQueryOptions, type UseQueryResult, useQuery } from "@tanstack/react-query";

import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.orderCancelSignedOrder} method to use with react-query.
 */
export function useCancelSignedOrder(
  request: CancelSignedOrderRequest,
  queryOptions?: Omit<
    UseQueryOptions<CancelSignedOrderResponse, OmnistonError>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<CancelSignedOrderResponse, OmnistonError> {
  const omniston = useOmniston();

  return useQuery({
    ...queryOptions,
    queryKey: ["orderCancelSignedOrder", request],
    queryFn: () => omniston.orderCancelSignedOrder(request),
  });
}
