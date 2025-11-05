import { Blockchain, useOmniston } from "@ston-fi/omniston-sdk-react";
import { Cell } from "@ton/core";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";

export function WithdrawButton(
  props: React.ComponentProps<typeof Button> & {
    quoteId: string;
  },
) {
  const [tonConnect] = useTonConnectUI();
  const wallet = useTonWallet();
  const omniston = useOmniston();

  const { quoteId, ...rest } = props;

  const sourceAddress = wallet?.account.address;

  const handleWithdrawClick = useCallback(async () => {
    if (!sourceAddress) {
      return;
    }

    const tx = await omniston.buildWithdrawal({
      quoteId,
      sourceAddress: {
        address: sourceAddress,
        blockchain: Blockchain.TON,
      },
    });

    const messages = tx.ton?.messages;

    if (!messages) {
      throw new Error("buildWithdrawal method failed. No TON messages found", {
        cause: tx,
      });
    }

    const { boc } = await tonConnect.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes
      messages: messages.map((message) => ({
        address: message.targetAddress,
        amount: message.sendAmount,
        payload: message.payload,
        stateInit: message.jettonWalletStateInit,
      })),
    });

    return { externalTxHash: Cell.fromBase64(boc).hash().toString("hex") };
  }, [omniston, sourceAddress, tonConnect, quoteId, sourceAddress]);

  return (
    <Button {...rest} onClick={handleWithdrawClick}>
      {rest.children}
    </Button>
  );
}
