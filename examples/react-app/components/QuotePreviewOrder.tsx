"use client";

import { ChevronDown } from "lucide-react";
import type { QuoteOfType } from "@ston-fi/omniston-sdk-react";

import { bigNumberToFloat, trimStringWithEllipsis } from "@/lib/utils";
import { DescriptionList } from "@/components/ui/description-list";
import { useAssets } from "@/providers/assets";
import { ExplorerAddressPreview } from "@/components/ExplorerAddressPreview";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { QuotePresenter } from "@/components/QuotePresenter";
import { CopyJsonCard } from "@/components/ui/copy-json-card";
import { addressFromAssetId } from "@/models/address";

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
  const { getAssetById } = useAssets();

  const outputAsset = getAssetById(quote.outputAsset);
  const inputAsset = getAssetById(quote.inputAsset);

  if (!outputAsset || !inputAsset) return null;

  const orderSettlementData = quote.settlementData.value;

  return (
    <DescriptionList {...props}>
      <li>
        <span>srcProtocolContractAddress</span>
        <ExplorerAddressPreview address={orderSettlementData.srcProtocolContractAddress}>
          {trimStringWithEllipsis(orderSettlementData.srcProtocolContractAddress.chain.value, 6)}
        </ExplorerAddressPreview>
      </li>
      {orderSettlementData.srcWrappedNativeTokenAddress ? (
        <li>
          <span>srcWrappedNativeTokenAddress</span>
          <ExplorerAddressPreview address={orderSettlementData.srcWrappedNativeTokenAddress}>
            {trimStringWithEllipsis(
              orderSettlementData.srcWrappedNativeTokenAddress.chain.value,
              6,
            )}
          </ExplorerAddressPreview>
        </li>
      ) : null}
      {orderSettlementData.srcInitialResolverAddress ? (
        <li>
          <span>srcInitialResolverAddress</span>
          <ExplorerAddressPreview address={orderSettlementData.srcInitialResolverAddress}>
            {trimStringWithEllipsis(orderSettlementData.srcInitialResolverAddress.chain.value, 6)}
          </ExplorerAddressPreview>
        </li>
      ) : null}
      {orderSettlementData.srcHtlcSecurityDepositAsset ? (
        <li>
          <span>srcHtlcSecurityDepositAsset</span>
          {trimStringWithEllipsis(
            addressFromAssetId(orderSettlementData.srcHtlcSecurityDepositAsset)!.chain.value,
            6,
          )}
        </li>
      ) : null}
      {orderSettlementData.srcHtlcSecurityDepositUnits ? (
        <li>
          <span>srcHtlcSecurityDepositUnits</span>
          <span>
            {`${bigNumberToFloat(orderSettlementData.srcHtlcSecurityDepositUnits, inputAsset.metadata.decimals)} ${inputAsset.metadata.symbol}`}
          </span>
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
          <ExplorerAddressPreview address={orderSettlementData.dstProtocolContractAddress}>
            {trimStringWithEllipsis(orderSettlementData.dstProtocolContractAddress.chain.value, 6)}
          </ExplorerAddressPreview>
        </li>
      ) : null}
      <li>
        <span>resolverSendsUnits</span>
        <span>
          {`${bigNumberToFloat(orderSettlementData.resolverSendsUnits, outputAsset.metadata.decimals)} ${outputAsset.metadata.symbol}`}
        </span>
      </li>
      {orderSettlementData.dstWrappedNativeTokenAddress ? (
        <li>
          <span>dstWrappedNativeTokenAddress</span>
          <ExplorerAddressPreview address={orderSettlementData.dstWrappedNativeTokenAddress}>
            {trimStringWithEllipsis(
              orderSettlementData.dstWrappedNativeTokenAddress.chain.value,
              6,
            )}
          </ExplorerAddressPreview>
        </li>
      ) : null}
      {orderSettlementData.dstSecurityDepositAsset ? (
        <li>
          <span>dstSecurityDepositAsset</span>
          {trimStringWithEllipsis(
            addressFromAssetId(orderSettlementData.dstSecurityDepositAsset)!.chain.value,
            6,
          )}
        </li>
      ) : null}
      {orderSettlementData.dstSecurityDepositUnits ? (
        <li>
          <span>dstSecurityDepositUnits</span>
          <span>
            {`${bigNumberToFloat(orderSettlementData.dstSecurityDepositUnits, inputAsset.metadata.decimals)} ${inputAsset.metadata.symbol}`}
          </span>
        </li>
      ) : null}
      <li>
        <span>tradeStartDeadline:</span>
        <pre>{new Date(orderSettlementData.tradeStartDeadline * 1000).toLocaleString()}</pre>
      </li>
      <li>
        <span>exclusivityTimeout:</span>
        <pre>{orderSettlementData.exclusivityTimeout}</pre>
      </li>
    </DescriptionList>
  );
}
