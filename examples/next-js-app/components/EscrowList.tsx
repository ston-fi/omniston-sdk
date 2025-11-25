"use client";

import {
  Blockchain,
  type EscrowOrderData,
  useEscrowList,
  useTrackTrade,
} from "@ston-fi/omniston-sdk-react";
import { useTonAddress } from "@tonconnect/ui-react";
import { ChevronDown } from "lucide-react";
import React, { useEffect, useState } from "react";

import { ExplorerTransactionPreview } from "@/components/ExplorerTransactionPreview";
import { QuoteDataPresenter } from "@/components/QuotePreview";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
      refetchInterval: 15_000,
    },
  );

  if (escrowListQuery.data?.orders.length) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <h2>Your pending escrow orders:</h2>

        <ul className="flex flex-col gap-1">
          {escrowListQuery.data.orders.map((escrowOrder) => (
            <EscrowListItem
              key={escrowOrder.escrowItemAddress.address}
              escrowOrder={escrowOrder}
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

function EscrowListItem({ escrowOrder }: { escrowOrder: EscrowOrderData }) {
  const { getAssetByAddress } = useAssets();

  const askAsset = getAssetByAddress(escrowOrder.quote.askAssetAddress.address);
  const bidAsset = getAssetByAddress(escrowOrder.quote.bidAssetAddress.address);

  if (!askAsset || !bidAsset) {
    return null;
  }

  return (
    <li className="flex flex-col gap-2 p-4 border rounded-md">
      <Collapsible>
        <CollapsibleTrigger className="inline-flex items-center justify-between w-full gap-1">
          <span className="font-mono">{`${bigNumberToFloat(escrowOrder.quote.bidUnits, bidAsset.meta.decimals)} ${bidAsset.meta.symbol} > ${bigNumberToFloat(escrowOrder.quote.askUnits, askAsset.meta.decimals)} ${askAsset.meta.symbol}`}</span>
          <ChevronDown
            size={16}
            className="transition-transform group-data-[state=open]:rotate-180 "
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 rounded-md p-2 bg-secondary/50">
            <QuoteDataPresenter quote={escrowOrder.quote} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex gap-2 items-center justify-end">
        <WithdrawButton
          variant="outline"
          size="sm"
          quoteId={escrowOrder.quote.quoteId}
        >
          Withdraw
        </WithdrawButton>

        <TrackTradeDialog escrowOrder={escrowOrder}>
          <Button size="sm" variant="secondary">
            Track Trade
          </Button>
        </TrackTradeDialog>
      </div>
    </li>
  );
}

function TrackTradeDialog({
  escrowOrder,
  children,
}: {
  escrowOrder: EscrowOrderData;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="*:max-w-full">
        <DialogHeader>
          <DialogTitle>Trade status</DialogTitle>
        </DialogHeader>

        <ExplorerTransactionPreview
          txId={escrowOrder.outgoingTxHash}
          className="font-mono truncate"
        >
          <small className="truncate">{escrowOrder.outgoingTxHash}</small>
        </ExplorerTransactionPreview>

        {
          // this is needed to reset the state on close and start new subscription on open
          open && <TrackTradeDialogStatusList escrowOrder={escrowOrder} />
        }
      </DialogContent>
    </Dialog>
  );
}

const TrackTradeDialogStatusList = ({
  escrowOrder,
}: {
  escrowOrder: EscrowOrderData;
}) => {
  const walletAddress = useTonAddress();

  const { data: tradeStatus } = useTrackTrade({
    quoteId: escrowOrder.quote.quoteId,
    outgoingTxHash: escrowOrder.outgoingTxHash,
    traderWalletAddress: {
      address: walletAddress,
      blockchain: Blockchain.TON,
    },
  });

  const [statuses, setStatuses] = useState<
    Array<NonNullable<typeof tradeStatus>>
  >([]);

  useEffect(() => {
    if (tradeStatus) {
      setStatuses((prev) => [...prev, tradeStatus]);
    }
  }, [tradeStatus]);

  return (
    <div className="flex flex-col gap-4 max-h-96 overflow-auto">
      {statuses.map((status, index) => (
        <div key={index} className="p-2 border-b">
          <pre className="whitespace-pre-wrap break-words overflow-x-auto text-xs">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
};
