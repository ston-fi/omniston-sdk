"use client";

import type { QuoteOfType } from "@ston-fi/omniston-sdk-react";
import { ChevronDown } from "lucide-react";

import { ExplorerAddressPreview } from "~/components/ExplorerAddressPreview";
import { QuotePresenter } from "~/components/QuotePresenter";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { CopyJsonCard } from "~/components/ui/copy-json-card";
import { DescriptionList } from "~/components/ui/description-list";
import { useFormatters } from "~/hooks/useFormatters";
import { useQuoteAssets } from "~/hooks/useQuoteAssets";

type OrderQuote = QuoteOfType<"order">;

export const QuotePreviewOrder = ({
  quote,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & { quote: OrderQuote }) => {
  return (
    <div {...props}>
      <QuotePresenter quote={quote} />

      <hr className="my-2" />

      <Collapsible className="group">
        <CollapsibleTrigger className="inline-flex w-full items-center justify-between gap-1">
          <span>SettlementData</span>
          <ChevronDown
            size={16}
            className="transition-transform group-data-[state=open]:rotate-180"
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CopyJsonCard title="" className="mt-2" value={quote.settlementData}>
            <OrderSettlementDataPresenter quote={quote} />
          </CopyJsonCard>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

function OrderSettlementDataPresenter({
  quote,
  ...props
}: React.ComponentProps<typeof DescriptionList> & {
  quote: OrderQuote;
}) {
  const { formatAddress, formatAssetId, formatAssetAmount } = useFormatters();
  const { inputAsset, inputNativeAsset, outputAsset, outputNativeAsset } =
    useQuoteAssets(quote);

  const orderSettlementData = quote.settlementData.value;

  return (
    <DescriptionList {...props}>
      <li>
        <span>srcProtocolContractAddress</span>
        <ExplorerAddressPreview
          address={orderSettlementData.srcProtocolContractAddress}
        >
          {formatAddress(orderSettlementData.srcProtocolContractAddress)}
        </ExplorerAddressPreview>
      </li>
      {orderSettlementData.srcWrappedNativeTokenAddress ? (
        <li>
          <span>srcWrappedNativeTokenAddress</span>
          <ExplorerAddressPreview
            address={orderSettlementData.srcWrappedNativeTokenAddress}
          >
            {formatAddress(orderSettlementData.srcWrappedNativeTokenAddress)}
          </ExplorerAddressPreview>
        </li>
      ) : null}
      {orderSettlementData.srcInitialResolverAddress ? (
        <li>
          <span>srcInitialResolverAddress</span>
          <ExplorerAddressPreview
            address={orderSettlementData.srcInitialResolverAddress}
          >
            {formatAddress(orderSettlementData.srcInitialResolverAddress)}
          </ExplorerAddressPreview>
        </li>
      ) : null}
      {orderSettlementData.srcHtlcSecurityDepositAsset ? (
        <li>
          <span>srcHtlcSecurityDepositAsset</span>
          <span>
            {formatAssetId(orderSettlementData.srcHtlcSecurityDepositAsset)}
          </span>
        </li>
      ) : null}
      {orderSettlementData.srcHtlcSecurityDepositUnits ? (
        <li>
          <span>srcHtlcSecurityDepositUnits</span>
          <span>{orderSettlementData.srcHtlcSecurityDepositUnits}</span>
        </li>
      ) : null}
      {orderSettlementData.htlcHashingFunction ? (
        <li>
          <span>htlcHashingFunction</span>
          <span>{orderSettlementData.htlcHashingFunction}</span>
        </li>
      ) : null}
      {orderSettlementData.dstProtocolContractAddress ? (
        <li>
          <span>dstProtocolContractAddress</span>
          <ExplorerAddressPreview
            address={orderSettlementData.dstProtocolContractAddress}
          >
            {formatAddress(orderSettlementData.dstProtocolContractAddress)}
          </ExplorerAddressPreview>
        </li>
      ) : null}
      <li>
        <span>resolverSendsUnits</span>
        <span>
          {formatAssetAmount(
            orderSettlementData.resolverSendsUnits,
            outputAsset,
          )}
        </span>
      </li>
      {orderSettlementData.dstWrappedNativeTokenAddress ? (
        <li>
          <span>dstWrappedNativeTokenAddress</span>
          <ExplorerAddressPreview
            address={orderSettlementData.dstWrappedNativeTokenAddress}
          >
            {formatAddress(orderSettlementData.dstWrappedNativeTokenAddress)}
          </ExplorerAddressPreview>
        </li>
      ) : null}
      {orderSettlementData.dstSecurityDepositAsset ? (
        <li>
          <span>dstSecurityDepositAsset</span>
          <span>
            {formatAssetId(orderSettlementData.dstSecurityDepositAsset)}
          </span>
        </li>
      ) : null}
      {orderSettlementData.dstSecurityDepositUnits ? (
        <li>
          <span>dstSecurityDepositUnits</span>
          <span>{orderSettlementData.dstSecurityDepositUnits}</span>
        </li>
      ) : null}
      <li>
        <span>tradeStartDeadline:</span>
        <pre>
          {new Date(
            orderSettlementData.tradeStartDeadline * 1000,
          ).toLocaleString()}
        </pre>
      </li>
      <li>
        <span>exclusivityTimeout:</span>
        <pre>{orderSettlementData.exclusivityTimeout}</pre>
      </li>
      <li>
        <span>integratorFeePips:</span>
        <pre>{orderSettlementData.integratorFeePips}</pre>
      </li>
      <li>
        <span>protocolFeePips:</span>
        <pre>{orderSettlementData.protocolFeePips}</pre>
      </li>
      {orderSettlementData.protocolFeeRecipientAddress ? (
        <li>
          <span>protocolFeeRecipientAddress:</span>
          <ExplorerAddressPreview
            address={orderSettlementData.protocolFeeRecipientAddress}
          >
            {formatAddress(orderSettlementData.protocolFeeRecipientAddress)}
          </ExplorerAddressPreview>
        </li>
      ) : null}
    </DescriptionList>
  );
}
