"use client";

import { useTonConnectModal, useTonWallet } from "@tonconnect/ui-react";
import { useCallback, useState } from "react";
import { matchQuoteByType } from "@ston-fi/omniston-sdk-react";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTonTransaction } from "@/hooks/useTonTransaction";
import { useRfq } from "@/hooks/useRfq";
import { useTradeTrackState } from "@/providers/trade-track";
import { useQuoteWallets } from "@/hooks/useTraderQuoteWallets";
import { CopyJsonCard } from "@/components/ui/copy-json-card";

const _QuoteActionTon = (props: Omit<ButtonProps, "children">) => {
  const [isClicked, setIsClicked] = useState(false);
  const [buildError, setBuildError] = useState<Error | null>(null);

  const buildAndSendTransaction = useTonTransaction();
  const { startTradeTrack } = useTradeTrackState();

  const { data: quoteEvent } = useRfq();
  const quote = quoteEvent?.$case === "quoteUpdated" ? quoteEvent.value : undefined;

  const { inputWalletAddress } = useQuoteWallets(quote);

  const handleQuoteClick = useCallback(async () => {
    if (!quote || !buildAndSendTransaction || !inputWalletAddress) {
      return;
    }

    try {
      setIsClicked(true);
      setBuildError(null);

      const { signedBoc, htlcSecrets } = await buildAndSendTransaction();

      matchQuoteByType(quote, {
        swap: async (swapQuote) => {
          await startTradeTrack({
            quote: swapQuote,
            trackTradeData: {
              quoteId: swapQuote.quoteId,
              traderAddress: inputWalletAddress,
              outgoingTxQuery: signedBoc,
            },
          });
        },
        order: async (orderQuote) => {
          await startTradeTrack({
            quote: orderQuote,
            htlcSecrets,
            trackTradeData: {
              quoteId: orderQuote.quoteId,
              traderAddress: inputWalletAddress,
            },
          });
        },
      });

      setBuildError(null);
    } catch (error) {
      setBuildError(error instanceof Error ? error : new Error("Unknown error", { cause: error }));
    } finally {
      setIsClicked(false);
    }
  }, [quote, inputWalletAddress, buildAndSendTransaction, startTradeTrack]);

  return (
    <div className="flex flex-col">
      <Button
        {...props}
        className={cn("relative z-10", props.className)}
        disabled={isClicked || !handleQuoteClick || props.disabled || !quote || !inputWalletAddress}
        onClick={handleQuoteClick}
      >
        {isClicked ? <Spinner /> : "Accept quote"}
      </Button>

      {buildError && (
        <div className="animate-in slide-in-from-top-2 fade-in -mt-2 duration-200">
          <CopyJsonCard
            title={<span className="m-0 truncate text-red-500">{buildError.message}</span>}
            value={buildError}
            className="rounded-t-none border-t-0 border-red-500/30 bg-gradient-to-b from-red-500/10 to-red-500/5 pt-2"
          >
            <pre className="mt-1 overflow-x-auto text-xs break-words whitespace-pre-wrap text-red-500 opacity-70">
              {buildError.stack}
            </pre>
          </CopyJsonCard>
        </div>
      )}
    </div>
  );
};

function withTonWalletGuard(Component: React.ComponentType<ButtonProps>) {
  return (props: ButtonProps) => {
    const wallet = useTonWallet();

    if (!wallet) {
      return (
        <Button
          {...props}
          onClick={(e) => {
            const tonConnectModal = useTonConnectModal();
            tonConnectModal.open();
            props.onClick?.(e);
          }}
        >
          Connect wallet
        </Button>
      );
    }

    return <Component {...props} />;
  };
}

export const QuoteActionTon = withTonWalletGuard(_QuoteActionTon);
