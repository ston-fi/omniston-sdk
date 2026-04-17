import { useTonConnectUI } from "@tonconnect/ui-react";
import { useMemo } from "react";
import { matchQuoteByType, isHtlcOrderQuote } from "@ston-fi/omniston-sdk-react";

import { useOmniston } from "@/hooks/useOmniston";
import { useRfq } from "@/hooks/useRfq";
import { useQuoteWallets } from "@/hooks/useTraderQuoteWallets";
import { hexToBase64 } from "@/lib/utils";
import { useSwapSettings } from "@/providers/swap-settings";
import { generateHashlock, generateHtlcSecret } from "@/lib/utils/htlc";

export function useTonTransaction() {
  const [tonConnect] = useTonConnectUI();
  const omniston = useOmniston();

  const { data: quoteEvent } = useRfq();
  const quote = quoteEvent?.$case === "quoteUpdated" ? quoteEvent.value : undefined;

  const { autoSlippageTolerance, htlcMaxExecutions } = useSwapSettings();

  const { inputWalletAddress, outputWalletAddress } = useQuoteWallets(quote);

  const buildAndSendTransaction = useMemo(() => {
    if (!quote) return undefined;
    if (!inputWalletAddress || !outputWalletAddress) return undefined;

    const sharedParams = {
      quoteId: quote.quoteId,
      transferSrcAddress: inputWalletAddress,
      refundSrcAddress: inputWalletAddress,
      gasExcessAddress: inputWalletAddress,
      traderDstAddress: outputWalletAddress,
    };

    return async () => {
      let htlcSecrets: Uint8Array<ArrayBufferLike>[] | undefined;

      const buildTxFn = matchQuoteByType(quote, {
        swap: () => async () =>
          omniston.tonBuildSwap({
            ...sharedParams,
            useRecommendedSlippage: autoSlippageTolerance,
          }),
        order: (orderQuote) => async () => {
          if (isHtlcOrderQuote(orderQuote)) {
            const secrets = Array.from({ length: htlcMaxExecutions }, generateHtlcSecret);
            const hashlocks = secrets.map((secret) =>
              generateHashlock(secret, orderQuote.settlementData.value.htlcHashingFunction),
            );

            htlcSecrets = secrets;

            return omniston.tonBuildEscrowTransfer({
              ...sharedParams,
              ownerSrcAddress: inputWalletAddress,
              htlcSecrets: {
                secretMode: {
                  $case: "provided",
                  value: {
                    hashes: hashlocks,
                  },
                },
              },
            });
          }

          return omniston.tonBuildEscrowTransfer({
            ...sharedParams,
            ownerSrcAddress: inputWalletAddress,
          });
        },
      });

      const { messages } = await buildTxFn();

      const { boc } = await tonConnect.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes
        from: tonConnect.account?.address,
        messages: messages.map((message) => ({
          address: message.targetAddress,
          amount: message.sendAmount,
          payload: hexToBase64(message.payload),
          stateInit: message.jettonWalletStateInit
            ? hexToBase64(message.jettonWalletStateInit)
            : undefined,
        })),
      });

      return { signedBoc: boc, htlcSecrets };
    };
  }, [inputWalletAddress, outputWalletAddress, quote?.quoteId]);

  return buildAndSendTransaction;
}
