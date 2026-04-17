import type { OrderSettlementData, Quote } from "../api/types";
import type { SettlementMethod } from "../constants";
import type { OneOf } from "../types/oneOf";
import type { QuoteOfType } from "../types/quote";

export function isQuoteOfType<T extends SettlementMethod>(
  quote: Quote,
  settlementMethod: T,
): quote is QuoteOfType<T> {
  return quote.settlementData?.$case === settlementMethod;
}

export function matchQuoteByType<TResult>(
  quote: Quote,
  handlers: {
    [T in SettlementMethod]: (quote: QuoteOfType<T>) => TResult;
  },
): TResult {
  if (!quote.settlementData) {
    throw new Error("Quote settlement type is not set");
  }

  return handlers[quote.settlementData.$case](quote as any);
}

export function isSwapQuote(quote: Quote): quote is QuoteOfType<"swap"> {
  return quote?.settlementData?.$case === "swap";
}

export function isOrderQuote(quote: Quote): quote is QuoteOfType<"order"> {
  return quote?.settlementData?.$case === "order";
}

type RequiredNonNullable<T, K extends keyof T> = T & {
  [P in K]-?: NonNullable<T[P]>;
};

export function isHtlcOrderQuote(quote: Quote): quote is QuoteOfType<"order"> & {
  settlementData: OneOf<
    "order",
    RequiredNonNullable<
      OrderSettlementData,
      | "srcHtlcSecurityDepositAsset"
      | "srcHtlcSecurityDepositUnits"
      | "htlcHashingFunction"
      | "dstProtocolContractAddress"
      | "dstSecurityDepositAsset"
      | "dstSecurityDepositUnits"
    >
  >;
} {
  if (!isOrderQuote(quote)) return false;

  if (quote.inputAsset.chain?.$case === "ton" && quote.outputAsset.chain?.$case === "ton") {
    return false;
  }

  return true;
}
