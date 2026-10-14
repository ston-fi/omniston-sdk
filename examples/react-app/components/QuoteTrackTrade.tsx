"use client";

import { matchQuoteByType } from "@ston-fi/omniston-sdk-react";

import { TradeTrackOrder } from "~/components/TradeTrackOrder";
import { TradeTrackSwap } from "~/components/TradeTrackSwap";
import { useTradeTrackState } from "~/providers/trade-track";

export function QuoteTrackTrade({ ...props }: { className?: string }) {
  const { quote: trackingQuote } = useTradeTrackState();

  if (!trackingQuote) return null;

  return matchQuoteByType(trackingQuote, {
    swap: () => <TradeTrackSwap {...props} />,
    order: () => <TradeTrackOrder {...props} />,
  });
}
