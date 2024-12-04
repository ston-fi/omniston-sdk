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

type QuoteTrackProps = {
  quoteId: Quote["quoteId"];
  walletAddress: string;
};

function withQuoteTrackProps<P extends QuoteTrackProps>(
  Component: React.ComponentType<P>,
) {
  // eslint-disable-next-line react/display-name
  return (props: Omit<P, "quoteId" | "walletAddress">) => {
    const { quoteId } = useTrackingQuoteState();
    const walletAddress = useTonAddress();

    if (!quoteId) return null;
    if (!walletAddress) return null;

    return (
      <Component
        {...(props as P)}
        quoteId={quoteId}
        walletAddress={walletAddress}
      />
    );
  };
}

export const QuoteTrack = withQuoteTrackProps(
  ({
    quoteId,
    walletAddress,
    ...props
  }: QuoteTrackProps & { className?: string }) => {
    const { data: tradeStatus } = useTrackTrade({
      quoteId,
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

  if (status.fillingTrade) {
    return (
      <span className="inline-flex gap-2 items-center">
        <Spinner />
        <span>Filling trade...</span>
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
