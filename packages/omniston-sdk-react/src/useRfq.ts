import type { Omniston, OmnistonError } from "@ston-fi/omniston-sdk";

import {
  type ObservableQueryResult,
  type UseObservableQueryOptions,
  useObservableQuery,
} from "./useObservableQuery";
import { useOmniston } from "./useOmniston";

type RequestForQuoteMethod = Omniston["requestForQuote"];
type RequestForQuoteMethodParameters = Parameters<RequestForQuoteMethod>[0];
type RequestForQuoteMethodResult = Awaited<ReturnType<RequestForQuoteMethod>>;

/**
 * Wrapper for {@link Omniston.requestForQuote} method to use with react-query.
 */
export function useRfq(
  quoteRequest: RequestForQuoteMethodParameters,
  queryOptions?: Omit<
    UseObservableQueryOptions<RequestForQuoteMethodResult, OmnistonError>,
    "queryKey" | "requestFn"
  >,
): ObservableQueryResult<RequestForQuoteMethodResult, OmnistonError> {
  const omniston = useOmniston();

  return useObservableQuery<RequestForQuoteMethodResult, OmnistonError>({
    ...queryOptions,
    queryKey: ["requestForQuote", quoteRequest],
    requestFn: () => omniston.requestForQuote(quoteRequest),
  });
}
