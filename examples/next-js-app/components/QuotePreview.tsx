"use client";

import type { Quote, SwapSettlementParams } from "@ston-fi/omniston-sdk-react";
import { ChevronDown } from "lucide-react";
import React, { useEffect, useState } from "react";

import { AddressPreview } from "@/components/AddressPreview";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Copy } from "@/components/ui/copy";
import { useRfq } from "@/hooks/useRfq";
import { bigNumberToFloat, cn, trimStringWithEllipsis } from "@/lib/utils";
import { useAssets } from "@/providers/assets";

export const QuotePreview = (props: { className?: string }) => {
  const { data: quoteEvent, error, isFetching, unsubscribe } = useRfq();

  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  if (!isFetching && error == null) {
    return null;
  }

  return (
    <div
      {...props}
      className={cn(
        "flex flex-col gap-2 p-4 border rounded-md",
        props.className,
      )}
    >
      {error ? (
        <QuoteError errorMessage={`[${error.code}] ${error.message}`} />
      ) : quoteEvent?.type === "unsubscribed" ? (
        <QuoteError errorMessage="Request timed out" />
      ) : quoteEvent?.type === "quoteUpdated" ? (
        <>
          <QuoteDataPresenter
            quote={quoteEvent.quote}
            rfqId={quoteEvent.rfqId}
          />
          <hr />
          <QuoteRouteVisualizer {...quoteEvent.quote} />
        </>
      ) : (
        <QuoteLoading />
      )}

      <button
        className="inline-flex px-1 items-center rounded-sm border border-destructive text-destructive my-2"
        onClick={unsubscribe}
      >
        Unsubscribe
      </button>
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

const QuoteDataPresenter = ({
  quote,
  rfqId,
}: {
  quote: Quote;
  rfqId: string;
}) => {
  const { getAssetByAddress } = useAssets();

  const askAsset = getAssetByAddress(quote.askAssetAddress.address);
  const bidAsset = getAssetByAddress(quote.bidAssetAddress.address);
  // TODO: why protocolFeeAsset currently can be null?
  const protocolFeeAsset = getAssetByAddress(quote.protocolFeeAsset!.address);

  if (!askAsset || !bidAsset || !protocolFeeAsset) {
    return null;
  }

  return (
    <ul
      className={`
        space-y-2
        [&>li]:grid [&>li]:grid-cols-[max-content__1fr] [&>li]:gap-2
        [&>li>*:nth-child(2)]:ml-auto [&>li>*:nth-child(2)]:font-mono [&>li>*:nth-child(2)]:truncate
      `}
    >
      <li>
        <span>RFQ ID:</span>
        <Copy value={rfqId}>{trimStringWithEllipsis(rfqId, 6)}</Copy>
      </li>
      <li>
        <span>Quote ID:</span>
        <Copy value={quote.quoteId}>
          {trimStringWithEllipsis(quote.quoteId, 6)}
        </Copy>
      </li>
      <li>
        <span>Resolved by:</span>
        <AddressPreview address={quote.resolverId}>
          {quote.resolverName}
        </AddressPreview>
      </li>
      <hr />
      <li>
        <span>Bid amount:</span>
        <span>
          {`${bigNumberToFloat(quote.bidUnits, bidAsset.meta.decimals)} ${bidAsset.meta.symbol}`}
        </span>
      </li>
      <li>
        <span>Ask amount:</span>
        <span>
          {`${bigNumberToFloat(quote.askUnits, askAsset.meta.decimals)} ${askAsset.meta.symbol}`}
        </span>
      </li>
      <li>
        <span>Protocol fee:</span>
        <span>
          {`${bigNumberToFloat(quote.protocolFeeUnits, protocolFeeAsset.meta.decimals)} ${protocolFeeAsset.meta.symbol}`}
        </span>
      </li>
      <li>
        <span>Estimated gas consumption:</span>
        <span>
          {`${bigNumberToFloat(quote.estimatedGasConsumption, 9)} TON`}
        </span>
      </li>
    </ul>
  );
};

function QuoteRouteVisualizer(quote: Quote) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group">
      <CollapsibleTrigger className="inline-flex items-center justify-between w-full gap-1">
        <span>View route details</span>
        <ChevronDown
          size={16}
          className="transition-transform group-data-[state=open]:rotate-180 "
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-md p-2 bg-secondary/50">
          {quote.params?.swap ? (
            <SwapRouteVisualizer {...quote.params.swap} />
          ) : quote.params?.escrow ? (
            <span>Escrow</span>
          ) : (
            <span>Unknown</span>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SwapRouteVisualizer(swapParams: SwapSettlementParams) {
  const {
    routes,
    minAskAmount,
    recommendedMinAskAmount,
    recommendedSlippageBps,
  } = swapParams;

  return (
    <div className="flex flex-col gap-2 relative">
      <button
        className="absolute -top-2 -right-2 text-xs opacity-50 hover:opacity-100 hover:text-primary p-2"
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(JSON.stringify(swapParams, null, 2));
        }}
      >
        Copy JSON
      </button>
      {routes.map((route, i) => (
        <SwapRouteVisualizerRoute
          key={i}
          swapParams={swapParams}
          route={route}
        />
      ))}
    </div>
  );
}

function SwapRouteVisualizerRoute({
  swapParams,
  route,
}: {
  swapParams: SwapSettlementParams;
  route: SwapSettlementParams["routes"][number];
}) {
  const { steps } = route;

  return (
    <div className="flex flex-col gap-2">
      <span>{`→ route ${swapParams.routes.indexOf(route) + 1}/${swapParams.routes.length}`}</span>
      {steps.map((step, i) => (
        <SwapRouteVisualizerStep
          key={i}
          swapParams={swapParams}
          route={route}
          step={step}
        />
      ))}
    </div>
  );
}

function SwapRouteVisualizerStep({
  swapParams,
  route,
  step,
}: {
  swapParams: SwapSettlementParams;
  route: SwapSettlementParams["routes"][number];
  step: SwapSettlementParams["routes"][number]["steps"][number];
}) {
  const { chunks, bidAssetAddress, askAssetAddress } = step;

  return (
    <div className="flex flex-col gap-2 ml-5">
      <span>
        {`↳ step ${route.steps.indexOf(step) + 1}/${route.steps.length}`}
      </span>
      {chunks.map((chunk, i) => (
        <SwapRouteVisualizerChunk
          key={i}
          swapParams={swapParams}
          route={route}
          step={step}
          chunk={chunk}
        />
      ))}
    </div>
  );
}

function SwapRouteVisualizerChunk({
  swapParams,
  route,
  step,
  chunk,
}: {
  swapParams: SwapSettlementParams;
  route: SwapSettlementParams["routes"][number];
  step: SwapSettlementParams["routes"][number]["steps"][number];
  chunk: SwapSettlementParams["routes"][number]["steps"][number]["chunks"][number];
}) {
  const { bidAssetAddress, askAssetAddress } = step;
  const { bidAmount, askAmount, protocol, extra, extraVersion } = chunk;

  const { getAssetByAddress } = useAssets();

  // TODO: why bidAssetAddress and askAssetAddress currently can be null?
  const bidAsset = getAssetByAddress(bidAssetAddress!.address);
  const askAsset = getAssetByAddress(askAssetAddress!.address);

  if (!bidAsset || !askAsset) {
    return null;
  }

  const chunkExtraStr = extra.toString();

  return (
    <div className="flex flex-col gap-2 ml-5">
      <span>{`↳ chunk ${step.chunks.indexOf(chunk) + 1}/${step.chunks.length}`}</span>
      <ul
        className={`
          space-y-2 ml-5
          [&>li]:grid [&>li]:grid-cols-[max-content__1fr] [&>li]:gap-2
          [&>li>*:nth-child(2)]:ml-auto [&>li>*:nth-child(2)]:font-mono
        `}
      >
        <li>
          <span>protocol:</span>
          <p>{protocol}</p>
        </li>
        <li>
          <span>bidAmount:</span>
          <p>{`${bigNumberToFloat(bidAmount, bidAsset.meta.decimals)} ${bidAsset.meta.symbol}`}</p>
        </li>
        <li>
          <span>askAmount:</span>
          <p>{`${bigNumberToFloat(askAmount, askAsset.meta.decimals)} ${askAsset.meta.symbol}`}</p>
        </li>
        <li>
          <span>{`extra (v${extraVersion}):`}</span>
          <Copy value={chunkExtraStr}>
            {trimStringWithEllipsis(chunkExtraStr, 6)}
          </Copy>
        </li>
      </ul>
    </div>
  );
}
