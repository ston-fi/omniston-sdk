import type { Quote } from "../dto/Quote";

export type QuoteResponseEvent =
  | QuoteResponseEvent_QuoteUpdated
  | QuoteResponseEvent_NoQuote
  | QuoteResponseEvent_Unsubscribed
  | QuoteResponseEvent_Ack;

export type QuoteResponseEvent_QuoteUpdated = {
  type: "quoteUpdated";
  quote: Quote;
  rfqId: string;
};

export type QuoteResponseEvent_NoQuote = {
  type: "noQuote";
  rfqId: string;
};

export type QuoteResponseEvent_Unsubscribed = {
  type: "unsubscribed";
  rfqId: string;
};

export type QuoteResponseEvent_Ack = {
  type: "ack";
  rfqId: string;
};
