import { useMemo } from "react";
import type { Quote } from "@ston-fi/omniston-sdk-react";

import { useConnectedWallets } from "~/hooks/useConnectedWallets";
import { Chain } from "~/models/chain";

export function useQuoteWallets(quote?: Pick<Quote, "inputAsset" | "outputAsset">) {
  const { walletAddressByChain: connectedWalletAddressByChain } = useConnectedWallets();

  const inputChain = quote?.inputAsset.chain.$case as Chain | undefined;
  const outputChain = quote?.outputAsset.chain.$case as Chain | undefined;

  return useMemo(
    () => ({
      inputWalletAddress: inputChain ? connectedWalletAddressByChain[inputChain] : undefined,
      outputWalletAddress: outputChain ? connectedWalletAddressByChain[outputChain] : undefined,
    }),
    [connectedWalletAddressByChain, inputChain, outputChain],
  );
}
