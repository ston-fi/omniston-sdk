import { useMemo } from "react";
import type { Quote } from "@ston-fi/omniston-sdk";

import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { Chain } from "@/models/chain";

export function useQuoteWallets(quote?: Pick<Quote, "inputAsset" | "outputAsset">) {
  const connectedWallets = useConnectedWallets();

  const inputChain = quote?.inputAsset.chain.$case as Chain | undefined;
  const outputChain = quote?.outputAsset.chain.$case as Chain | undefined;

  return useMemo(
    () => ({
      inputWalletAddress: inputChain ? connectedWallets[inputChain] : undefined,
      outputWalletAddress: outputChain ? connectedWallets[outputChain] : undefined,
    }),
    [connectedWallets, inputChain, outputChain],
  );
}
