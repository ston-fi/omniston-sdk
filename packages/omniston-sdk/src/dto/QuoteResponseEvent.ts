import type { Quote } from "../dto/Quote";

export type QuoteResponseEvent =
  | QuoteResponseEvent_QuoteUpdated
  | QuoteResponseEvent_NoQuote
  | QuoteResponseEvent_Unsubscribed
  | QuoteResponseEvent_Ack;

export const QuoteResponseEventType = {
  QuoteUpdated: "quoteUpdated",
  NoQuote: "noQuote",
  Unsubscribed: "unsubscribed",
  Ack: "ack",
} as const;

export type QuoteResponseEventType =
  (typeof QuoteResponseEventType)[keyof typeof QuoteResponseEventType];

export type QuoteResponseEvent_QuoteUpdated = {
  type: typeof QuoteResponseEventType.QuoteUpdated;
  quote: Quote;
  rfqId: string;
};

export type QuoteResponseEvent_NoQuote = {
  type: typeof QuoteResponseEventType.NoQuote;
  rfqId: string;
};

export type QuoteResponseEvent_Unsubscribed = {
  type: typeof QuoteResponseEventType.Unsubscribed;
  rfqId: string;
};

export type QuoteResponseEvent_Ack = {
  type: typeof QuoteResponseEventType.Ack;
  rfqId: string;
};
