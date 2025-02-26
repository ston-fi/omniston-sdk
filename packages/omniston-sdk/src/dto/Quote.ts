import { Quote as ApiQuote } from "../api/messages/omni/v1beta6/types/quote";
import type { SetNonNullable } from "../types";

export type Quote = SetNonNullable<
  ApiQuote,
  "offerAssetAddress" | "askAssetAddress" | "referrerAddress"
>;

export const Quote = ApiQuote;
