import { QuoteRequest as ApiQuoteRequest } from "../api/messages/omni/v1beta6/types/quote";
import type { RequestSettlementParams } from "../dto/RequestSettlementParams";
import type { OverrideProperties, SetOptional } from "../types";

export type QuoteRequest = OverrideProperties<
  SetOptional<
    ApiQuoteRequest,
    | "referrerAddress"
    | "referrerFeeBps"
    | "askAssetAddress"
    | "offerAssetAddress"
  >,
  { settlementParams?: RequestSettlementParams }
>;

export const QuoteRequest = {
  fromJSON(object: unknown): QuoteRequest {
    return ApiQuoteRequest.fromJSON(object);
  },

  toJSON(quoteRequest: QuoteRequest): unknown {
    return ApiQuoteRequest.toJSON(ApiQuoteRequest.fromPartial(quoteRequest));
  },
};
