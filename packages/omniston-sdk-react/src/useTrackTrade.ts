"use client";

import type { TrackTradeRequest, TradeStatus } from "@ston-fi/omniston-sdk";

import {
  type UseObservableQueryOptions,
  useObservableQuery,
} from "./useObservableQuery";
import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.trackTrade} method to use with react-query.
 */
export function useTrackTrade(
  request: TrackTradeRequest,
  queryOptions?: Omit<
    UseObservableQueryOptions<TradeStatus>,
    "queryKey" | "requestFn"
  >,
) {
  const omniston = useOmniston();

  return useObservableQuery({
    ...queryOptions,
    queryKey: ["trackTrade", request],
    requestFn: () => omniston.trackTrade(request),
  });
}
