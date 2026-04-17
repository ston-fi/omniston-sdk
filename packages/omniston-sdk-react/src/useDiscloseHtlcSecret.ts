import type { DiscloseHtlcSecretRequest, OmnistonError } from "@ston-fi/omniston-sdk";
import { type UseQueryOptions, type UseQueryResult, useQuery } from "@tanstack/react-query";

import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.orderDiscloseHtlcSecret} method to use with react-query.
 */
export function useDiscloseHtlcSecret(
  request: DiscloseHtlcSecretRequest,
  queryOptions?: Omit<UseQueryOptions<void, OmnistonError>, "queryKey" | "queryFn">,
): UseQueryResult<void, OmnistonError> {
  const omniston = useOmniston();

  return useQuery({
    ...queryOptions,
    queryKey: ["orderDiscloseHtlcSecret", request],
    queryFn: () => omniston.orderDiscloseHtlcSecret(request),
  });
}
