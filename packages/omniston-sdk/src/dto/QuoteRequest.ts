import { QuoteRequest as ApiQuoteRequest } from "@/api/messages/omni/v1beta5/types/quote";
import type { SetOptional } from "@/types";

export type QuoteRequest = SetOptional<
  ApiQuoteRequest,
  "referrerAddress" | "referrerFeeBps" | "askAssetAddress" | "offerAssetAddress"
>;

export const QuoteRequest = {
  fromJSON(object: unknown): QuoteRequest {
    return ApiQuoteRequest.fromJSON(object);
  },

  toJSON(quoteRequest: QuoteRequest): unknown {
    return ApiQuoteRequest.toJSON(ApiQuoteRequest.fromPartial(quoteRequest));
  },
};
