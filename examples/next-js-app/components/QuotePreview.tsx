"use client";

import { useRfq } from "@/hooks/useRfq";
import type { Quote } from "@ston-fi/omniston-sdk-react";

import { bigNumberToFloat, cn } from "@/lib/utils";
import { useSwapForm } from "@/providers/swap-form";

export const QuotePreview = (props: { className?: string }) => {
  const { data: quoteEvent, error, isFetching } = useRfq();

  if (!isFetching) {
    return null;
  }

  return (
    <div {...props} className={cn("p-4 border rounded-md", props.className)}>
      {error ? (
        <QuoteError errorMessage={error.message} />
      ) : quoteEvent?.type === "unsubscribed" ? (
        <QuoteError errorMessage="Request timed out" />
      ) : quoteEvent?.type === "quoteUpdated" ? (
        <QuoteData quote={quoteEvent.quote} />
      ) : (
        <QuoteLoading />
      )}
    </div>
  );
};

const QuoteError = ({ errorMessage }: { errorMessage: string }) => {
  return (
    <div className="text-red-500">
      <span>Error:&nbsp;</span>
      <span className="overflow-hidden text-ellipsis">{errorMessage}</span>
    </div>
  );
};

const QuoteLoading = () => {
  return <span>Waiting for a quote...</span>;
};

const QuoteData = ({ quote }: { quote: Quote }) => {
  const { askAsset, offerAsset } = useSwapForm();

  if (!askAsset || !offerAsset) {
    return null;
  }

  return (
    <ul className="grid grid-cols-[max-content,_1fr] gap-2">
      <li className="contents">
        <b>Offer amount:</b>
        <span className="overflow-hidden text-ellipsis text-right">
          {bigNumberToFloat(quote.offerUnits, offerAsset.decimals)}&nbsp;
          {offerAsset.symbol}
        </span>
      </li>
      <li className="contents">
        <b>Ask amount:</b>
        <span className="overflow-hidden text-ellipsis text-right">
          {bigNumberToFloat(quote.askUnits, askAsset.decimals)}&nbsp;
          {askAsset.symbol}
        </span>
      </li>
      <li className="contents">
        <b>Protocol fee:</b>
        <span className="overflow-hidden text-ellipsis text-right">
          {bigNumberToFloat(quote.protocolFeeUnits, offerAsset.decimals)}&nbsp;
          {offerAsset.symbol}
        </span>
      </li>
    </ul>
  );
};
