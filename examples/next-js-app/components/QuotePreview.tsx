"use client";

import type { Quote } from "@ston-fi/omniston-sdk-react";
import { ExternalLink } from "lucide-react";
import { useEffect } from "react";

import { useAssets } from "@/hooks/useAssets";
import { useExplorer } from "@/hooks/useExplorer";
import { useRfq } from "@/hooks/useRfq";
import { bigNumberToFloat, cn } from "@/lib/utils";
import { useSwapForm } from "@/providers/swap-form";

export const QuotePreview = (props: { className?: string }) => {
  const { data: quoteEvent, error, isFetching } = useRfq();

  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  if (!isFetching && error == null) {
    return null;
  }

  return (
    <div {...props} className={cn("p-4 border rounded-md", props.className)}>
      {error ? (
        <QuoteError errorMessage={`[${error.code}] ${error.message}`} />
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

  const protocolFeeAsset = useAssets({
    select: (assets) =>
      assets.filter(
        (asset) => asset.address === quote.protocolFeeAsset?.address,
      ),
  }).data[0]!;

  const { nftPreviewUrl } = useExplorer();

  if (!askAsset || !offerAsset) {
    return null;
  }

  return (
    <ul className="space-y-2 [&>li]:grid [&>li]:grid-cols-[max-content,_1fr] [&>li]:gap-2">
      <li>
        <b>Offer amount:</b>
        <span className="overflow-hidden text-ellipsis text-right">
          {bigNumberToFloat(quote.offerUnits, offerAsset.decimals)}
          &nbsp;
          {offerAsset.symbol}
        </span>
      </li>
      <li>
        <b>Ask amount:</b>
        <span className="overflow-hidden text-ellipsis text-right">
          {bigNumberToFloat(quote.askUnits, askAsset.decimals)}
          &nbsp;
          {askAsset.symbol}
        </span>
      </li>
      <li>
        <b>Protocol fee:</b>
        <span className="overflow-hidden text-ellipsis text-right">
          {bigNumberToFloat(quote.protocolFeeUnits, protocolFeeAsset.decimals)}
          &nbsp;
          {protocolFeeAsset.symbol}
        </span>
      </li>
      <li>
        <b>Estimated gas consumption:</b>
        <span className="overflow-hidden text-ellipsis text-right">
          {bigNumberToFloat(quote.estimatedGasConsumption, 9)}
          &nbsp; TON
        </span>
      </li>
      <hr />
      <li>
        <b>Resolved by:</b>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={nftPreviewUrl(quote.resolverId).toString()}
          className="overflow-hidden text-ellipsis text-end hover:text-primary inline-flex gap-1 items-center justify-end"
        >
          {quote.resolverName}
          <ExternalLink size={16} />
        </a>
      </li>
    </ul>
  );
};
