"use client";

import type { Quote, QuoteRequest } from "@ston-fi/omniston-sdk";
import type { UseQueryResult } from "@tanstack/react-query";

import {
  useObservableQuery,
  type UseObservableQueryOptions,
} from "./useObservableQuery";
import { useOmniston } from "./useOmniston";

/**
 * Wrapper for {@link Omniston.requestForQuote} method to use with react-query.
 */
export function useRfq(
  quoteRequest: QuoteRequest,
  queryOptions?: Omit<
    UseObservableQueryOptions<Quote | null>,
    "queryKey" | "requestFn"
  >,
): UseQueryResult<Quote | null> {
  const omniston = useOmniston();

  return useObservableQuery({
    ...queryOptions,
    queryKey: ["requestForQuote", quoteRequest],
    requestFn: () => omniston.requestForQuote(quoteRequest),
  });
}
