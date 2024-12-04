"use client";

import { useState } from "react";

import { Blockchain, useOmniston } from "@ston-fi/omniston-sdk-react";
import {
  useTonConnectModal,
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react";
import { useMemo } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useRfq } from "@/hooks/useRfq";
import { percentToPercentBps } from "@/lib/utils";
import { useSwapSettings } from "@/providers/swap-settings";
import { useTrackingQuoteState } from "@/providers/tracking-quote";

export const QuoteAction = (buttonProps: Omit<ButtonProps, "children">) => {
  const [tonConnect] = useTonConnectUI();
  const tonConnectModal = useTonConnectModal();
  const wallet = useTonWallet();
  const omniston = useOmniston();
  const { slippageTolerance } = useSwapSettings();
  const { data: quoteEvent } = useRfq();
  const quote =
    quoteEvent?.type === "quoteUpdated" ? quoteEvent.quote : undefined;

  const { setQuoteId } = useTrackingQuoteState();

  const [isClicked, setIsClicked] = useState(false);

  const handleQuoteClick = useMemo(() => {
    if (!wallet) return undefined;
    if (!quote) return undefined;

    return async () => {
      try {
        setIsClicked(true);

        const tx = await omniston.buildTransfer({
          quote,
          sourceAddress: {
            address: wallet?.account.address.toString(),
            blockchain: Blockchain.TON,
          },
          destinationAddress: {
            address: wallet?.account.address.toString(),
            blockchain: Blockchain.TON,
          },
          maxSlippageBps: percentToPercentBps(slippageTolerance),
        });

        const omniMessages = tx.transaction?.ton?.messages;

        if (!omniMessages) {
          throw new Error(
            "buildTransfer method failed. No TON messages found",
            { cause: tx },
          );
        }

        setQuoteId(quote.quoteId);

        await tonConnect.sendTransaction({
          validUntil: Date.now() + 1000000,
          messages: omniMessages.map((message) => ({
            address: message.targetAddress,
            amount: message.sendAmount,
            payload: message.payload,
          })),
        });
      } catch (error) {
        console.error(error);
        setQuoteId(null);
      } finally {
        setIsClicked(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.account.address, quote?.quoteId, slippageTolerance]);

  return wallet ? (
    <Button
      {...buttonProps}
      disabled={isClicked || !handleQuoteClick || buttonProps.disabled}
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
