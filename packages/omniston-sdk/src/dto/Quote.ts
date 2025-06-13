import { Quote as ApiQuote } from "../api/messages/omni/v1beta7/types/quote";
import type { SetNonNullable } from "../types";

export type Quote = SetNonNullable<
  ApiQuote,
  "bidAssetAddress" | "askAssetAddress" | "referrerAddress"
>;

export const Quote = ApiQuote;
