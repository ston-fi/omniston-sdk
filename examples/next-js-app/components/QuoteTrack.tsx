"use client";

import {
  Blockchain,
  type Quote,
  type TradeStatus,
  useOmniston,
} from "@ston-fi/omniston-sdk-react";
import { useTonAddress } from "@tonconnect/ui-react";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useOutgoingTxHash } from "@/hooks/useOutgoingTxHash";
import { cn } from "@/lib/utils";
import { useTrackingQuoteState } from "@/providers/tracking-quote";
import { WithdrawButton } from "./WithdrawButton";

type QuoteTrackProps = {
  quoteId: Quote["quoteId"];
  outgoingTxHash: string;
  walletAddress: string;
};

function withQuoteTrackProps<P extends QuoteTrackProps>(
  Component: React.ComponentType<P>,
) {
  // eslint-disable-next-line react/display-name
  return (props: Omit<P, "quoteId" | "walletAddress" | "outgoingTxHash">) => {
    const { quoteId, externalTxHash } = useTrackingQuoteState();
    const walletAddress = useTonAddress();
    const outgoingTxHash = useOutgoingTxHash(externalTxHash);

    if (!quoteId) return null;
    if (!walletAddress) return null;

    if (outgoingTxHash.status === "loading") {
      return (
        <div className="p-4 border rounded-md">
          <span className="inline-flex gap-2 items-center">
            <Spinner />
            <span>{"Loading transaction hash..."}</span>
          </span>
        </div>
      );
    }

    if (outgoingTxHash.status === "error") {
      return (
        <div className="p-4 border rounded-md text-red-500">
          {`Error loading transaction hash: ${outgoingTxHash.error.message}`}
        </div>
      );
    }

    return (
      <Component
        {...(props as P)}
        quoteId={quoteId}
        outgoingTxHash={outgoingTxHash.data}
        walletAddress={walletAddress}
      />
    );
  };
}

export const QuoteTrack = withQuoteTrackProps(
  ({
    quoteId,
    outgoingTxHash,
    walletAddress,
    ...props
  }: QuoteTrackProps & { className?: string }) => {
    const [tradeStatuses, setTradeStatuses] = useState<TradeStatus[]>([]);

    const omniston = useOmniston();

    useEffect(() => {
      const trackTradeParams = {
        quoteId,
        outgoingTxHash,
        traderWalletAddress: {
          address: walletAddress,
          blockchain: Blockchain.TON,
        },
      };

      const subscription = omniston.trackTrade(trackTradeParams).subscribe({
        next: (status) => {
          setTradeStatuses((prevStatuses) => [...prevStatuses, status]);
        },
        error: (error) => {
          //
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    }, [omniston, quoteId, outgoingTxHash, walletAddress]);

    const tradeStatus = tradeStatuses[tradeStatuses.length - 1];

    if (!tradeStatus) {
      return null;
    }

    return (
      <div className={cn("p-4 border rounded-md spaced-y-2", props.className)}>
        <TradeStatusesPresenter quoteId={quoteId} statuses={tradeStatuses} />

        <div className="flex gap-2 items-center">
          <span>Transfer timestamp:</span>
          <pre>
            {new Date(tradeStatus.transferTimestamp * 1000).toLocaleString()}
          </pre>
        </div>
        <div className="flex gap-2 items-center">
          <span>Estimated finish timestamp: </span>
          <pre>
            {new Date(
              tradeStatus.estimatedFinishTimestamp * 1000,
            ).toLocaleString()}
          </pre>
        </div>
      </div>
    );
  },
);

function TradeStatusesPresenter({
  quoteId,
  statuses,
}: {
  quoteId: string;
  statuses: TradeStatus[];
}) {
  const unsubscribed = findStatus(statuses, "unsubscribed");

  if (unsubscribed) {
    return <span>Request timed out</span>;
  }

  const tradeSettled = findStatus(statuses, "tradeSettled");

  if (tradeSettled) {
    return (
      <span className="inline-flex gap-2 items-center">
        <span>Trade Settled:</span>
        <pre>{tradeSettled.result}</pre>
      </span>
    );
  }

  const receivingFunds = findStatus(statuses, "receivingFunds");

  if (receivingFunds) {
    return (
      <span className="inline-flex gap-2 items-center">
        <Spinner />
        <span>Receiving funds...</span>
      </span>
    );
  }

  const awaitingFill = findStatus(statuses, "awaitingFill");
  const refundAvailableStatus = findStatus(statuses, "refundAvailable");

  if (awaitingFill || refundAvailableStatus) {
    return (
      <>
        {awaitingFill && (
          <span className="inline-flex gap-2 items-center">
            <Spinner />
            <span>Waiting for trade to be filled...</span>
          </span>
        )}
        {refundAvailableStatus && (
          <span className="inline-flex gap-2 items-center">
            <span>Refund available</span>
            <WithdrawButton size="sm" quoteId={quoteId}>
              Withdraw
            </WithdrawButton>
          </span>
        )}
      </>
    );
  }

  const swapping = findStatus(statuses, "swapping");

  if (swapping) {
    return (
      <span className="inline-flex gap-2 items-center">
        <Spinner />
        <span>Swapping...</span>
      </span>
    );
  }

  const transferring = findStatus(statuses, "transferring");

  if (transferring) {
    return (
      <span className="inline-flex gap-2 items-center">
        <Spinner />
        <span>Transferring...</span>
      </span>
    );
  }

  const awaitingTransfer = findStatus(statuses, "awaitingTransfer");

  if (awaitingTransfer) {
    return <span>Awaiting Transfer...</span>;
  }

  return null;
}

function findStatus<K extends keyof NonNullable<TradeStatus["status"]>>(
  statuses: TradeStatus[],
  statusKey: K,
): NonNullable<NonNullable<TradeStatus["status"]>[K]> | undefined {
  const found = statuses.find(
    ({ status }) => status?.[statusKey] !== undefined,
  );

  return found?.status?.[statusKey] as
    | NonNullable<NonNullable<TradeStatus["status"]>[K]>
    | undefined;
}
