import type { Quote } from "../api/types";

import type { SettlementMethod } from "../constants";

import type { OneOfCase } from "./oneOf";

type QuoteSettlementData = NonNullable<Quote["settlementData"]>;

export type QuoteOfType<T extends SettlementMethod> = Omit<Quote, "settlementData"> & {
  settlementData: OneOfCase<QuoteSettlementData, T> & Extract<QuoteSettlementData, { $case: T }>;
};
