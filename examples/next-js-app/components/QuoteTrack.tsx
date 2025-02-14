"use client";

import {
  Blockchain,
  type Quote,
  type TradeStatus,
  useTrackTrade,
} from "@ston-fi/omniston-sdk-react";
import { useTonAddress } from "@tonconnect/ui-react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useTrackingQuoteState } from "@/providers/tracking-quote";
import { useOutgoingTxHash } from "@/hooks/useOutgoingTxHash";

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
    const { data: tradeStatus } = useTrackTrade({
      quoteId,
      outgoingTxHash,
      traderWalletAddress: {
        address: walletAddress,
        blockchain: Blockchain.TON,
      },
    });

    if (!tradeStatus?.status) return null;

    return (
      <div className={cn("p-4 border rounded-md", props.className)}>
        <TradeStatusContent status={tradeStatus.status} />
      </div>
    );
  },
);

function TradeStatusContent({
  status,
}: {
  status: NonNullable<TradeStatus["status"]>;
}) {
  if (status.unsubscribed) {
    return <span>Request timed out</span>;
  }

  if (status.awaitingTransfer) {
    return <span>Awaiting Transfer</span>;
  }

  if (status.transferring) {
    return (
      <span className="inline-flex gap-2 items-center">
        <Spinner />
        <span>Transferring...</span>
      </span>
    );
  }

  if (status.awaitingFill) {
    return (
      <span className="inline-flex gap-2 items-center">
        <Spinner />
        <span>Waiting for trade to be filled...</span>
      </span>
    );
  }

  if (status.swapping) {
    return (
      <span className="inline-flex gap-2 items-center">
        <Spinner />
        <span>Swapping...</span>
      </span>
    );
  }

  if (status.tradeSettled) {
    return (
      <span className="inline-flex gap-2 items-center">
        <span>Trade Settled</span>
        <pre>{status.tradeSettled.result}</pre>
      </span>
    );
  }

  return (
    <span className="inline-flex gap-2 items-center">
      <pre>{JSON.stringify(status, null, 2)}</pre>
    </span>
  );
}
