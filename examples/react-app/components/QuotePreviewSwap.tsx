"use client";

import type { QuoteOfType } from "@ston-fi/omniston-sdk-react";
import { ChevronDown } from "lucide-react";

import { QuotePresenter } from "~/components/QuotePresenter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { CopyJsonCard } from "~/components/ui/copy-json-card";
import { DescriptionList } from "~/components/ui/description-list";
import { bigNumberToFloat, cn } from "~/lib/utils";
import { pipsToPercent } from "~/lib/utils/percent";
import { serializeAssetId } from "~/models/asset-id";
import { useAssets } from "~/providers/assets";

type SwapQuote = QuoteOfType<"swap">;

export const QuotePreviewSwap = ({ quote }: { quote: SwapQuote }) => {
  const swapSettlementData = quote.settlementData.value;

  return (
    <>
      <QuotePresenter quote={quote} />

      <hr />

      <Collapsible className="group">
        <CollapsibleTrigger className="inline-flex w-full items-center justify-between gap-1">
          <span>SettlementData</span>
          <ChevronDown
            size={16}
            className="transition-transform group-data-[state=open]:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CopyJsonCard title="" className="mt-2" value={swapSettlementData}>
            {swapSettlementData.priceImpactPips !== undefined ? (
              <DescriptionList className="mb-2">
                <li>
                  <span>priceImpactPips:</span>
                  <span>
                    {swapSettlementData.priceImpactPips}{" "}
                    {`(${pipsToPercent(swapSettlementData.priceImpactPips)})%`}
                  </span>
                </li>
              </DescriptionList>
            ) : null}
            {swapSettlementData.routes.map((route, i) => (
              <SwapRouteItem key={i} swapSettlementData={swapSettlementData} route={route} />
            ))}
          </CopyJsonCard>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
};

function SwapRouteItem({
  swapSettlementData,
  route,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  swapSettlementData: SwapQuote["settlementData"]["value"];
  route: SwapQuote["settlementData"]["value"]["routes"][number];
}) {
  const { steps } = route;

  return (
    <div {...props} className={cn("flex flex-col gap-2", className)}>
      <span>{`↳ route ${swapSettlementData.routes.indexOf(route) + 1}/${swapSettlementData.routes.length}`}</span>
      {steps.map((step, i) => (
        <SwapStepItem key={i} route={route} step={step} className="ml-5" />
      ))}
    </div>
  );
}

function SwapStepItem({
  route,
  step,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  route: SwapQuote["settlementData"]["value"]["routes"][number];
  step: SwapQuote["settlementData"]["value"]["routes"][number]["steps"][number];
}) {
  const { chunks } = step;

  return (
    <div {...props} className={cn("flex flex-col gap-2", className)}>
      <span>{`↳ step ${route.steps.indexOf(step) + 1}/${route.steps.length}`}</span>
      {chunks.map((chunk, i) => (
        <SwapChunkItem key={i} step={step} chunk={chunk} className="ml-5" />
      ))}
    </div>
  );
}

function SwapChunkItem({
  step,
  chunk,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  step: SwapQuote["settlementData"]["value"]["routes"][number]["steps"][number];
  chunk: SwapQuote["settlementData"]["value"]["routes"][number]["steps"][number]["chunks"][number];
}) {
  const { getAssetById } = useAssets();

  const inputAssetId = step.inputAsset;
  const inputAsset = getAssetById(inputAssetId);

  if (!inputAsset) {
    throw new Error(
      `Can't display the swap chunk. ${serializeAssetId(inputAssetId)} is missing in store`,
    );
  }

  const outputAssetId = step.outputAsset;
  const outputAsset = getAssetById(outputAssetId);

  if (!outputAsset) {
    throw new Error(
      `Can't display the swap chunk. ${serializeAssetId(outputAssetId)} is missing in store`,
    );
  }

  return (
    <div {...props} className={cn("flex flex-col gap-2", className)}>
      <span>{`↳ chunk ${step.chunks.indexOf(chunk) + 1}/${step.chunks.length}`}</span>
      <DescriptionList className="ml-5">
        <li>
          <span>protocol:</span>
          <p>{chunk.protocol}</p>
        </li>
        <li>
          <span>inputUnits:</span>
          <p>{`${bigNumberToFloat(chunk.inputUnits, inputAsset.metadata.decimals)} ${inputAsset.metadata.symbol}`}</p>
        </li>
        <li>
          <span>outputUnits:</span>
          <p>{`${bigNumberToFloat(chunk.outputUnits, outputAsset.metadata.decimals)} ${outputAsset.metadata.symbol}`}</p>
        </li>
      </DescriptionList>
    </div>
  );
}
