"use client";

import type {
  OmnistonError,
  QuoteRequest,
  QuoteResponseEvent,
} from "@ston-fi/omniston-sdk";
import type { UseQueryResult } from "@tanstack/react-query";

import {
  type UseObservableQueryOptions,
  useObservableQuery,
} from "./useObservableQuery";
import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.requestForQuote} method to use with react-query.
 */
export function useRfq(
  quoteRequest: QuoteRequest,
  queryOptions?: Omit<
    UseObservableQueryOptions<QuoteResponseEvent>,
    "queryKey" | "requestFn"
  >,
): UseQueryResult<QuoteResponseEvent, OmnistonError> {
  const omniston = useOmniston();

  return useObservableQuery({
    ...queryOptions,
    queryKey: ["requestForQuote", quoteRequest],
    requestFn: () => omniston.requestForQuote(quoteRequest),
  });
}
