"use client";

import {
  type SwapSettlementData,
  type SwapProgress,
  type SwapProgressEvent,
  SwapChunkResult,
  type QuoteOfType,
  isSwapQuote,
} from "@ston-fi/omniston-sdk-react";

import { bigNumberToFloat, cn, trimStringWithEllipsis } from "@/lib/utils";
import { useAssets } from "@/providers/assets";
import { Spinner } from "./ui/spinner";
import { ExplorerTransactionPreview } from "./ExplorerTransactionPreview";
import { ExplorerAddressPreview } from "./ExplorerAddressPreview";
import { TradeTrackStatusPresenter } from "./TradeTrackStatusPresenter";
import { DescriptionList } from "./ui/description-list";
import { Skeleton } from "./ui/skeleton";
import { Chain } from "@/models/chain";
import { CopyJsonCard } from "./ui/copy-json-card";
import { useTradeTrackState } from "@/providers/trade-track";

export function TradeTrackSwap(props: { className?: string }) {
  const { quote: trackingQuote, tradeEvent: tradeTrackProgress } = useTradeTrackState();

  if (!trackingQuote || !isSwapQuote(trackingQuote)) return null;

  const swapTrackEvent =
    tradeTrackProgress?.$case === "swap" ? tradeTrackProgress.value : undefined;

  switch (swapTrackEvent?.$case) {
    case "awaitingTransfer": {
      return <AwaitingTransferEventView {...props} event={swapTrackEvent} />;
    }
    case "progress": {
      return <ProgressEventView {...props} quote={trackingQuote} event={swapTrackEvent} />;
    }
    case "unsubscribed": {
      return <UnsubscribedEventView {...props} />;
    }
    default: {
      <TradeTrackSwapCard {...props}>
        <DescriptionList>
          <li>
            <span>Awaiting swap status information...</span>
          </li>
        </DescriptionList>
        <hr />
        <Skeleton className="h-[88px] w-full" />
      </TradeTrackSwapCard>;
    }
  }
}

function TradeTrackSwapCard({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("flex flex-col gap-2 p-4 border rounded-md", className)}>
      {children}
    </div>
  );
}

function AwaitingTransferEventView({
  event,
  className,
}: {
  event: Extract<NonNullable<SwapProgressEvent["event"]>, { $case: "awaitingTransfer" }>;
  className?: string;
}) {
  return (
    <TradeTrackSwapCard className={className}>
      <DescriptionList>
        <li>
          <span>Status:</span>
          <span className="inline-flex items-center gap-2">
            <Spinner />
            <span>Awaiting transfer...</span>
          </span>
        </li>
        <hr />
        <li>
          <span>Event:</span>
          <span>{event.$case}</span>
        </li>
      </DescriptionList>
      <Skeleton className="h-[88px] w-full" />
    </TradeTrackSwapCard>
  );
}

function ProgressEventView({
  event,
  quote,
  className,
}: {
  event: Extract<
    NonNullable<SwapProgressEvent["event"]>,
    { $case: "progress"; value: SwapProgress }
  >;
  quote: QuoteOfType<"swap">;
  className?: string;
}) {
  const { status, transferTimestamp, estimatedFinishTimestamp, routes } = event.value;

  return (
    <TradeTrackSwapCard className={className}>
      <DescriptionList>
        <li>
          <span>Status:</span>
          <TradeTrackStatusPresenter status={status} />
        </li>

        <hr />

        {transferTimestamp ? (
          <li>
            <span>Transfer timestamp:</span>
            <span>{new Date(transferTimestamp * 1000).toLocaleString()}</span>
          </li>
        ) : null}
        {estimatedFinishTimestamp ? (
          <li>
            <span>Estimated finish timestamp:</span>
            <span>{new Date(estimatedFinishTimestamp * 1000).toLocaleString()}</span>
          </li>
        ) : null}
      </DescriptionList>

      {routes.length > 0 ? (
        <CopyJsonCard title="" value={routes}>
          {routes.map((route, i) => (
            <SwapRouteItem
              key={i}
              swapSettlementData={quote.settlementData.value}
              swapStatus={event.value}
              route={route}
            />
          ))}
        </CopyJsonCard>
      ) : null}
    </TradeTrackSwapCard>
  );
}

function UnsubscribedEventView(props: { className?: string }) {
  return (
    <TradeTrackSwapCard {...props}>
      <DescriptionList>
        <li>
          <span>Status:</span>
          <span className="text-red-500">Unsubscribed</span>
        </li>
      </DescriptionList>
    </TradeTrackSwapCard>
  );
}

function SwapRouteItem({
  swapSettlementData,
  swapStatus,
  route,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  swapSettlementData: SwapSettlementData;
  swapStatus: SwapProgress;
  route: SwapProgress["routes"][number];
}) {
  const { steps } = route;

  const routeIndex = swapStatus.routes.indexOf(route);

  const routeSwapSettlementData = swapSettlementData.routes[routeIndex];
  if (!routeSwapSettlementData) throw new Error("Unexpected undefined");

  return (
    <div {...props} className={cn("flex flex-col gap-2", className)}>
      <span>{`↳ route ${routeIndex + 1}/${swapStatus.routes.length}`}</span>
      {steps.map((step, i) => {
        const stepSwapSettlementData = routeSwapSettlementData.steps[i];
        if (!stepSwapSettlementData) throw new Error("Unexpected undefined");

        return (
          <SwapStepItem
            key={i}
            className="ml-5"
            swapSettlementData={stepSwapSettlementData}
            route={route}
            step={step}
          />
        );
      })}
    </div>
  );
}

function SwapStepItem({
  swapSettlementData,
  route,
  step,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  swapSettlementData: Pick<
    SwapSettlementData["routes"][number]["steps"][number],
    "outputAsset" | "inputAsset"
  >;
  route: SwapProgress["routes"][number];
  step: SwapProgress["routes"][number]["steps"][number];
}) {
  const { chunks } = step;

  return (
    <div {...props} className={cn("flex flex-col gap-2", className)}>
      <span>{`↳ step ${route.steps.indexOf(step) + 1}/${route.steps.length}`}</span>
      {chunks.map((chunk, i) => (
        <SwapChunkItem
          key={i}
          className="ml-5"
          swapSettlementData={swapSettlementData}
          step={step}
          chunk={chunk}
        />
      ))}
    </div>
  );
}

function SwapChunkItem({
  swapSettlementData,
  step,
  chunk,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  swapSettlementData: Pick<
    SwapSettlementData["routes"][number]["steps"][number],
    "outputAsset" | "inputAsset"
  >;
  step: SwapProgress["routes"][number]["steps"][number];
  chunk: SwapProgress["routes"][number]["steps"][number]["chunks"][number];
}) {
  const {
    targetAddress,
    inputUnits,
    expectedOutputUnits,
    actualOutputUnits,
    result,
    protocol,
    txHash,
  } = chunk;

  const { getAssetById } = useAssets();

  const inputAsset = getAssetById(swapSettlementData.inputAsset);
  const outputAsset = getAssetById(swapSettlementData.outputAsset);

  if (!inputAsset || !outputAsset) {
    return null;
  }

  return (
    <div {...props} className={cn("flex flex-col gap-2 ml-5", className)}>
      <span>{`↳ chunk ${step.chunks.indexOf(chunk) + 1}/${step.chunks.length}`}</span>
      <DescriptionList className="ml-5">
        <li>
          <span>result:</span>
          <SwapChunkResultPresenter result={result} />
        </li>
        <li>
          <span>protocol:</span>
          <p>{protocol}</p>
        </li>
        <li>
          <span>inputUnits:</span>
          <p>{`${bigNumberToFloat(inputUnits, inputAsset.metadata.decimals)} ${inputAsset.metadata.symbol}`}</p>
        </li>
        <li>
          <span>expectedOutputUnits:</span>
          <p>{`${bigNumberToFloat(expectedOutputUnits, outputAsset.metadata.decimals)} ${outputAsset.metadata.symbol}`}</p>
        </li>
        <li>
          <span>actualOutputUnits:</span>
          <p>{`${bigNumberToFloat(actualOutputUnits, outputAsset.metadata.decimals)} ${outputAsset.metadata.symbol}`}</p>
        </li>
        <li>
          <span>targetAddress</span>
          <ExplorerAddressPreview address={targetAddress}>
            {trimStringWithEllipsis(targetAddress.chain.value, 6)}
          </ExplorerAddressPreview>
        </li>
        <li>
          <span>txHash</span>
          <ExplorerTransactionPreview
            chain={Chain.TON}
            txId={txHash}
            className="truncate font-mono"
          >
            {trimStringWithEllipsis(txHash, 6)}
          </ExplorerTransactionPreview>
        </li>
      </DescriptionList>
    </div>
  );
}

function SwapChunkResultPresenter({ result }: { result: SwapChunkResult }) {
  if (result === "SWAP_CHUNK_RESULT_PROCESSING") {
    return (
      <p className="inline-flex items-center gap-2">
        <Spinner />
        <span>In progress...</span>
      </p>
    );
  } else if (result === "SWAP_CHUNK_RESULT_FILLED") {
    return <p className="text-green-500">Filled</p>;
  } else if (result === "SWAP_CHUNK_RESULT_ABORTED") {
    return <p className="text-red-500">Aborted</p>;
  } else if (result === "UNRECOGNIZED") {
    return <p className="text-red-500">Unrecognized</p>;
  }

  return null;
}
