"use client";

import type { Quote } from "@ston-fi/omniston-sdk-react";

import { bigNumberToFloat, trimStringWithEllipsis } from "@/lib/utils";
import { DescriptionList } from "@/components/ui/description-list";
import { useAssets } from "@/providers/assets";
import { ExplorerAddressPreview } from "@/components/ExplorerAddressPreview";
import { Chain } from "@/models/chain";

export function QuotePresenter({
  quote,
  ...props
}: React.ComponentProps<typeof DescriptionList> & {
  quote: Quote;
}) {
  const { getAssetById, getNativeAsset } = useAssets();

  const inputAsset = getAssetById(quote.inputAsset);
  const inputNativeAsset = getNativeAsset(quote.inputAsset.chain.$case);
  const outputAsset = getAssetById(quote.outputAsset);

  if (!outputAsset || !inputAsset || !inputNativeAsset) {
    return null;
  }

  const {
    rfqId,
    quoteId,
    resolverId,
    resolverName,
    inputUnits,
    outputUnits,
    protocolFeeUnits,
    estimatedGasConsumption,
    gasBudget,
    integratorFeeUnits,
    integratorAddress,
    ...rest
  } = quote;

  return (
    <DescriptionList {...props}>
      <li>
        <span>Resolved by:</span>
        <ExplorerAddressPreview
          address={{
            chain: {
              $case: Chain.TON,
              value: resolverId,
            },
          }}
        >
          {resolverName}
        </ExplorerAddressPreview>
      </li>
      <li>
        <span>Input amount:</span>
        <span>
          {`${bigNumberToFloat(inputUnits, inputAsset.metadata.decimals)} ${inputAsset.metadata.symbol}`}
        </span>
      </li>
      <li>
        <span>Output amount:</span>
        <span>
          {`${bigNumberToFloat(outputUnits, outputAsset.metadata.decimals)} ${outputAsset.metadata.symbol}`}
        </span>
      </li>
      <li>
        <span>Protocol fee:</span>
        <span>
          {`${bigNumberToFloat(protocolFeeUnits, outputAsset.metadata.decimals)} ${outputAsset.metadata.symbol}`}
        </span>
      </li>
      {integratorAddress ? (
        <>
          <li>
            <span>Integrator fee address:</span>
            <ExplorerAddressPreview address={integratorAddress}>
              {trimStringWithEllipsis(integratorAddress.chain.value, 6)}
            </ExplorerAddressPreview>
          </li>
          <li>
            <span>Integrator fee:</span>
            <span>
              {`${bigNumberToFloat(integratorFeeUnits, outputAsset.metadata.decimals)} ${outputAsset.metadata.symbol}`}
            </span>
          </li>
        </>
      ) : null}
      {gasBudget ? (
        <li>
          <span>Gas budget:</span>
          <span>{`${bigNumberToFloat(gasBudget, inputNativeAsset.metadata.decimals)} ${inputNativeAsset.metadata.symbol}`}</span>
        </li>
      ) : null}
      {estimatedGasConsumption ? (
        <li>
          <span>Estimated gas consumption:</span>
          <span>{`${bigNumberToFloat(estimatedGasConsumption, inputNativeAsset.metadata.decimals)} ${inputNativeAsset.metadata.symbol}`}</span>
        </li>
      ) : null}
    </DescriptionList>
  );
}
