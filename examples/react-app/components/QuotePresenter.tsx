"use client";

import type { Quote } from "@ston-fi/omniston-sdk-react";

import { ExplorerAddressPreview } from "~/components/ExplorerAddressPreview";
import { DescriptionList } from "~/components/ui/description-list";
import { useFormatters } from "~/hooks/useFormatters";
import { useQuoteAssets } from "~/hooks/useQuoteAssets";
import { Chain } from "~/models/chain";

export function QuotePresenter({
  quote,
  ...props
}: React.ComponentProps<typeof DescriptionList> & {
  quote: Quote;
}) {
  const { formatAddress, formatAssetAmount } = useFormatters();
  const { inputAsset, inputNativeAsset, outputAsset, outputNativeAsset } =
    useQuoteAssets(quote);

  const {
    rfqId,
    quoteId,
    resolverId,
    resolverName,
    inputUnits,
    outputUnits,
    protocolFeeUnits,
    estimatedGasConsumption,
    estimatedSettlementDuration,
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
        <span>{formatAssetAmount(inputUnits, inputAsset)}</span>
      </li>
      <li>
        <span>Output amount:</span>
        <span>{formatAssetAmount(outputUnits, outputAsset)}</span>
      </li>
      <li>
        <span>Protocol fee:</span>
        <span>{formatAssetAmount(protocolFeeUnits, outputAsset)}</span>
      </li>
      {integratorAddress ? (
        <>
          <li>
            <span>Integrator fee address:</span>
            <ExplorerAddressPreview address={integratorAddress}>
              {formatAddress(integratorAddress)}
            </ExplorerAddressPreview>
          </li>
          <li>
            <span>Integrator fee:</span>
            <span>{formatAssetAmount(integratorFeeUnits, outputAsset)}</span>
          </li>
        </>
      ) : null}
      {gasBudget ? (
        <li>
          <span>Gas budget:</span>
          <span>{formatAssetAmount(gasBudget, inputNativeAsset)}</span>
        </li>
      ) : null}
      {estimatedGasConsumption ? (
        <li>
          <span>Estimated gas consumption:</span>
          <span>
            {formatAssetAmount(estimatedGasConsumption, inputNativeAsset)}
          </span>
        </li>
      ) : null}
      {estimatedSettlementDuration ? (
        <li>
          <span>Estimated settlement duration:</span>
          <span>{`${estimatedSettlementDuration}s`}</span>
        </li>
      ) : null}
    </DescriptionList>
  );
}
