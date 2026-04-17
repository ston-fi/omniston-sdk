import type {
  BuildEvmOrderPayloadRequest,
  EvmOrderPayloadResponse,
  OmnistonError,
} from "@ston-fi/omniston-sdk";
import { type UseQueryOptions, type UseQueryResult, useQuery } from "@tanstack/react-query";

import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.evmBuildOrderPayload} method to use with react-query.
 */
export function useEvmBuildOrderPayload(
  request: BuildEvmOrderPayloadRequest,
  queryOptions?: Omit<
    UseQueryOptions<EvmOrderPayloadResponse, OmnistonError>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<EvmOrderPayloadResponse, OmnistonError> {
  const omniston = useOmniston();

  return useQuery({
    ...queryOptions,
    queryKey: ["evmBuildOrderPayload", request],
    queryFn: () => omniston.evmBuildOrderPayload(request),
  });
}
