import type { OmnistonError, RegisterSignedOrderRequest } from "@ston-fi/omniston-sdk";
import { type UseQueryOptions, type UseQueryResult, useQuery } from "@tanstack/react-query";

import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.orderRegisterSignedOrder} method to use with react-query.
 */
export function useRegisterSignedOrder(
  request: RegisterSignedOrderRequest,
  queryOptions?: Omit<UseQueryOptions<void, OmnistonError>, "queryKey" | "queryFn">,
): UseQueryResult<void, OmnistonError> {
  const omniston = useOmniston();

  return useQuery({
    ...queryOptions,
    queryKey: ["orderRegisterSignedOrder", request],
    queryFn: () => omniston.orderRegisterSignedOrder(request),
  });
}
