"use client";

import { matchQuoteByType } from "@ston-fi/omniston-sdk-react";

import { useTradeTrackState } from "@/providers/trade-track";
import { TradeTrackSwap } from "@/components/TradeTrackSwap";
import { TradeTrackOrder } from "@/components/TradeTrackOrder";

export function QuoteTrackTrade({ ...props }: { className?: string }) {
  const { quote: trackingQuote } = useTradeTrackState();

  if (!trackingQuote) return null;

  return matchQuoteByType(trackingQuote, {
    swap: () => <TradeTrackSwap {...props} />,
    order: () => <TradeTrackOrder {...props} />,
  });
}
