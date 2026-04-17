"use client";

import { type Quote, matchQuoteByType } from "@ston-fi/omniston-sdk-react";

import { Copy } from "@/components/ui/copy";
import { DescriptionList } from "@/components/ui/description-list";
import { useRfq } from "@/hooks/useRfq";
import { cn, trimStringWithEllipsis } from "@/lib/utils";
import { useTradeTrackState } from "@/providers/trade-track";
import { QuotePreviewSwap } from "@/components/QuotePreviewSwap";
import { QuotePreviewOrder } from "@/components/QuotePreviewOrder";
import { RfqEventHistory } from "@/components/RfqEventHistory";

export const QuotePreview = (props: { className?: string }) => {
  const { data: quoteEvent, error, isFetching } = useRfq();
  const quote = quoteEvent?.$case === "quoteUpdated" ? quoteEvent.value : undefined;

  const { quote: trackingQuote } = useTradeTrackState();

  if (!isFetching && error == null && !trackingQuote) {
    return null;
  }

  return (
    <div {...props} className={cn("flex flex-col gap-2 p-4 border rounded-md", props.className)}>
      {error ? (
        <QuoteError error={error} />
      ) : quote ? (
        <QuotePreviewPresenter quote={quote} />
      ) : trackingQuote ? (
        <QuotePreviewPresenter quote={trackingQuote} />
      ) : null}

      <RfqEventHistory />
    </div>
  );
};

const QuoteError = ({ error }: { error: unknown }) => {
  const errorMessage =
    error instanceof Error
      ? `[${(error as any).code}] ${error.message}`
      : "An unknown error occurred";

  return (
    <div className="text-red-500">
      <span>Error:&nbsp;</span>
      <span className="overflow-hidden text-ellipsis">{errorMessage}</span>
    </div>
  );
};

const QuotePreviewPresenter = ({ quote }: { quote: Quote }) => {
  return (
    <>
      <QuoteIdPresenter quoteId={quote.quoteId} rfqId={quote.rfqId} />
      <hr />
      <QuoteDataPresenter quote={quote} />
    </>
  );
};

const QuoteIdPresenter = ({ quoteId, rfqId }: { quoteId: Quote["quoteId"]; rfqId: string }) => {
  return (
    <DescriptionList>
      <li>
        <span>RFQ ID:</span>
        <Copy value={rfqId}>{trimStringWithEllipsis(rfqId, 6)}</Copy>
      </li>
      <li>
        <span>Quote ID:</span>
        <Copy value={quoteId}>{trimStringWithEllipsis(quoteId, 6)}</Copy>
      </li>
    </DescriptionList>
  );
};

export const QuoteDataPresenter = ({ quote }: { quote: Quote }) => {
  return matchQuoteByType(quote, {
    swap: (swapQuote) => <QuotePreviewSwap quote={swapQuote} />,
    order: (orderQuote) => <QuotePreviewOrder quote={orderQuote} />,
  });
};
