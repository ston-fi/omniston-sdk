import type {
  ActiveOrdersRequest,
  ActiveOrdersResponse,
  OmnistonError,
} from "@ston-fi/omniston-sdk";
import { type UseQueryOptions, type UseQueryResult, useQuery } from "@tanstack/react-query";

import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.orderGetActive} method to use with react-query.
 */
export function useActiveOrders(
  request: ActiveOrdersRequest,
  queryOptions?: Omit<UseQueryOptions<ActiveOrdersResponse, OmnistonError>, "queryKey" | "queryFn">,
): UseQueryResult<ActiveOrdersResponse, OmnistonError> {
  const omniston = useOmniston();

  return useQuery({
    ...queryOptions,
    queryKey: ["orderGetActive", request],
    queryFn: () => omniston.orderGetActive(request),
  });
}
