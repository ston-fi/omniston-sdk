import { Blockchain } from "@ston-fi/omniston-sdk-react";
import { Cell } from "@ton/core";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useMemo } from "react";

import { useOmniston } from "@/hooks/useOmniston";
import { useRfq } from "@/hooks/useRfq";
import { useSwapSettings } from "@/providers/swap-settings";

export function useBuildAndSendTransaction() {
  const [tonConnect] = useTonConnectUI();
  const wallet = useTonWallet();
  const omniston = useOmniston();
  const { data: quoteEvent } = useRfq();
  const quote =
    quoteEvent?.type === "quoteUpdated" ? quoteEvent.quote : undefined;

  const { autoSlippageTolerance } = useSwapSettings();

  return useMemo(() => {
    if (!wallet) return undefined;
    if (!quote) return undefined;

    return async () => {
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
        gasExcessAddress: {
          address: wallet?.account.address.toString(),
          blockchain: Blockchain.TON,
        },
        useRecommendedSlippage: autoSlippageTolerance,
      });

      const omniMessages = tx.ton?.messages;

      if (!omniMessages) {
        throw new Error("buildTransfer method failed. No TON messages found", {
          cause: tx,
        });
      }

      const { boc } = await tonConnect.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes
        messages: omniMessages.map((message) => ({
          address: message.targetAddress,
          amount: message.sendAmount,
          payload: message.payload,
          stateInit: message.jettonWalletStateInit,
        })),
      });

      return { externalTxHash: Cell.fromBase64(boc).hash().toString("hex") };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.account.address, quote?.quoteId]);
}
