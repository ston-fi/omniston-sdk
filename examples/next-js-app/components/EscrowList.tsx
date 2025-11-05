"use client";

import {
  Blockchain,
  type EscrowOrderData,
  useEscrowList,
} from "@ston-fi/omniston-sdk-react";
import { ChevronDown } from "lucide-react";

import { ExplorerTransactionPreview } from "@/components/ExplorerTransactionPreview";
import { QuoteDataPresenter } from "@/components/QuotePreview";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { bigNumberToFloat, cn } from "@/lib/utils";
import { useAssets } from "@/providers/assets";
import { WithdrawButton } from "./WithdrawButton";

export const EscrowList = ({
  className,
  walletAddress,
}: {
  className?: string;
  walletAddress: string;
}) => {
  const escrowListQuery = useEscrowList(
    {
      traderWalletAddress: {
        address: walletAddress,
        blockchain: Blockchain.TON,
      },
    },
    {
      refetchInterval: 10_000,
    },
  );

  if (escrowListQuery.data?.orders.length) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <h2>Your pending escrow orders:</h2>

        <ul className="flex flex-col gap-1">
          {escrowListQuery.data.orders.map((escrow) => (
            <EscrowListItem
              key={escrow.escrowItemAddress.address}
              escrow={escrow}
            />
          ))}
        </ul>
      </div>
    );
  } else if (escrowListQuery.error) {
    console.error(escrowListQuery.error);
  } else {
    return null;
  }
};

function EscrowListItem({ escrow }: { escrow: EscrowOrderData }) {
  const { getAssetByAddress } = useAssets();

  const askAsset = getAssetByAddress(escrow.quote.askAssetAddress.address);
  const bidAsset = getAssetByAddress(escrow.quote.bidAssetAddress.address);

  if (!askAsset || !bidAsset) {
    return null;
  }

  return (
    <li className="flex flex-col gap-2 p-4 border rounded-md">
      <Collapsible>
        <CollapsibleTrigger className="inline-flex items-center justify-between w-full gap-1">
          <span className="font-mono">{`${bigNumberToFloat(escrow.quote.bidUnits, bidAsset.meta.decimals)} ${bidAsset.meta.symbol} > ${bigNumberToFloat(escrow.quote.askUnits, askAsset.meta.decimals)} ${askAsset.meta.symbol}`}</span>
          <ChevronDown
            size={16}
            className="transition-transform group-data-[state=open]:rotate-180 "
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 rounded-md p-2 bg-secondary/50">
            <QuoteDataPresenter quote={escrow.quote} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex gap-2 items-center justify-between">
        <ExplorerTransactionPreview
          txId={escrow.outgoingTxHash}
          className="font-mono truncate"
        >
          <small className="truncate">{escrow.outgoingTxHash}</small>
        </ExplorerTransactionPreview>

        <WithdrawButton
          variant="secondary"
          size="sm"
          quoteId={escrow.quote.quoteId}
        >
          Withdraw
        </WithdrawButton>
      </div>
    </li>
  );
}
