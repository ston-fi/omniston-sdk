"use client";

import { useTonConnectModal, useTonWallet } from "@tonconnect/ui-react";
import { useCallback, useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useBuildAndSendTransaction } from "@/hooks/useBuildAndSendTransaction";
import { useRfq } from "@/hooks/useRfq";
import { useTrackingQuoteState } from "@/providers/tracking-quote";

export const QuoteAction = (buttonProps: Omit<ButtonProps, "children">) => {
  const tonConnectModal = useTonConnectModal();
  const wallet = useTonWallet();
  const { data: quoteEvent } = useRfq();
  const quote =
    quoteEvent?.type === "quoteUpdated" ? quoteEvent.quote : undefined;

  const { setQuoteId, setExternalTxHash } = useTrackingQuoteState();

  const [isClicked, setIsClicked] = useState(false);

  const buildAndSendTransaction = useBuildAndSendTransaction();

  const handleQuoteClick = useCallback(async () => {
    if (!quote || !buildAndSendTransaction) return undefined;

    try {
      setIsClicked(true);
      const { externalTxHash } = await buildAndSendTransaction();
      setQuoteId(quote.quoteId);
      setExternalTxHash(externalTxHash);
    } catch (error) {
      console.error(error);
      setQuoteId(null);
      setExternalTxHash(null);
    } finally {
      setIsClicked(false);
    }
  }, [buildAndSendTransaction, quote]);

  return wallet ? (
    <Button
      {...buttonProps}
      disabled={
        isClicked || !handleQuoteClick || buttonProps.disabled || !quote
      }
      onClick={handleQuoteClick}
    >
      Accept quote
    </Button>
  ) : (
    <Button
      {...buttonProps}
      onClick={(e) => {
        tonConnectModal.open();
        buttonProps.onClick?.(e);
      }}
    >
      Connect wallet
    </Button>
  );
};
