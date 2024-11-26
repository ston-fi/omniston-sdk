"use client";

import {
  Blockchain,
  type Quote,
  type TradeStatus,
  useTrackTrade,
} from "@ston-fi/omniston-sdk-react";
import { useTonAddress } from "@tonconnect/ui-react";

import { Spinner } from "@/components/ui/spinner";
import { useRfq } from "@/hooks/useRfq";
import { cn } from "@/lib/utils";

type QuoteTrackProps = {
  quote: Quote;
  walletAddress: string;
};

function withQuoteTrackProps<P extends QuoteTrackProps>(
  Component: React.ComponentType<P>,
) {
  // eslint-disable-next-line react/display-name
  return (props: Omit<P, "quote" | "walletAddress">) => {
    const { data: quote } = useRfq();
    const walletAddress = useTonAddress();

    if (!quote) return null;
    if (!walletAddress) return null;

    return (
      <Component
        {...(props as P)}
        quote={quote}
        walletAddress={walletAddress}
      />
    );
  };
}

export const QuoteTrack = withQuoteTrackProps(
  ({
    quote,
    walletAddress,
    ...props
  }: QuoteTrackProps & { className?: string }) => {
    const { data: tradeStatus } = useTrackTrade({
      quoteId: quote.quoteId,
      traderWalletAddress: {
        address: walletAddress,
        blockchain: Blockchain.TON,
      },
    });

    if (!tradeStatus?.status) return null;

    return (
      <div className={cn("p-4 border rounded-md", props.className)}>
        <TradeStatusContent quote={quote} status={tradeStatus.status} />
      </div>
    );
  },
);

function TradeStatusContent({
  quote,
  status,
}: {
  quote: Quote;
  status: NonNullable<TradeStatus["status"]>;
}) {
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
