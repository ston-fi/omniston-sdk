import type { Omniston, OmnistonError } from "@ston-fi/omniston-sdk";

import {
  type ObservableQueryResult,
  type UseObservableQueryOptions,
  useObservableQuery,
} from "./useObservableQuery";
import { useOmniston } from "./useOmniston";

type OrderTrackMethod = Omniston["orderTrack"];
type OrderTrackMethodParameters = Parameters<OrderTrackMethod>[0];
type OrderTrackMethodResult = Awaited<ReturnType<OrderTrackMethod>>;

/**
 * Wrapper for {@link Omniston.orderTrack} method to use with react-query.
 */
export function useOrderTrack(
  request: OrderTrackMethodParameters,
  queryOptions?: Omit<
    UseObservableQueryOptions<OrderTrackMethodResult, OmnistonError>,
    "queryKey" | "requestFn"
  >,
): ObservableQueryResult<OrderTrackMethodResult, OmnistonError> {
  const omniston = useOmniston();

  return useObservableQuery<OrderTrackMethodResult, OmnistonError>({
    ...queryOptions,
    queryKey: ["orderTrack", request],
    requestFn: () => omniston.orderTrack(request),
  });
}
