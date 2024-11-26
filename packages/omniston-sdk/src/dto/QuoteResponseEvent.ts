import type { Quote } from "../dto/Quote";

export type QuoteResponseEvent =
  | QuoteResponseEvent_QuoteUpdated
  | QuoteResponseEvent_NoQuote
  | QuoteResponseEvent_Unsubscribed;

export type QuoteResponseEvent_QuoteUpdated = {
  type: "quoteUpdated";
  quote: Quote;
};

export type QuoteResponseEvent_NoQuote = {
  type: "noQuote";
};

export type QuoteResponseEvent_Unsubscribed = {
  type: "unsubscribed";
};
