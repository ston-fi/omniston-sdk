import {
  QuoteEvent as ApiQuoteEvent,
  type QuoteEvent_EventOneOf,
} from "../api/messages/omni/v1beta5/trader/quote";
import type { Quote } from "../dto/Quote";
import type { Converter, OverrideProperties } from "../types";

type EventOneOf = OverrideProperties<
  QuoteEvent_EventOneOf,
  { quoteUpdated?: Quote | undefined }
>;

export type QuoteEvent = OverrideProperties<
  ApiQuoteEvent,
  { event: EventOneOf }
>;

export const QuoteEvent = ApiQuoteEvent as Converter<QuoteEvent>;
