import type { Omniston, OmnistonError } from "@ston-fi/omniston-sdk";

import {
  type ObservableQueryResult,
  type UseObservableQueryOptions,
  useObservableQuery,
} from "./useObservableQuery";
import { useOmniston } from "./useOmniston";

type SwapTrackMethod = Omniston["swapTrack"];
type SwapTrackMethodParameters = Parameters<SwapTrackMethod>[0];
type SwapTrackMethodResult = Awaited<ReturnType<SwapTrackMethod>>;

/**
 * Wrapper for {@link Omniston.swapTrack} method to use with react-query.
 */
export function useSwapTrack(
  request: SwapTrackMethodParameters,
  queryOptions?: Omit<
    UseObservableQueryOptions<SwapTrackMethodResult, OmnistonError>,
    "queryKey" | "requestFn"
  >,
): ObservableQueryResult<SwapTrackMethodResult, OmnistonError> {
  const omniston = useOmniston();

  return useObservableQuery<SwapTrackMethodResult, OmnistonError>({
    ...queryOptions,
    queryKey: ["swapTrack", request],
    requestFn: () => omniston.swapTrack(request),
  });
}
