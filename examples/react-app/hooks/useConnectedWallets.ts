import { useTonAddress } from "@tonconnect/ui-react";
import { base } from "@reown/appkit/networks";
import { useMemo } from "react";
import { useConnection as useWagmiConnection } from "wagmi";
import type { ChainAddress } from "@ston-fi/omniston-sdk-react";

import { Chain } from "@/models/chain";

export function useConnectedWallets() {
  const tonConnectWalletAddressString = useTonAddress();

  const {
    address: connectedWalletAddressString,
    chainId: connectedWalletChainId,
    isConnected,
  } = useWagmiConnection();

  const baseWalletAddressString =
    isConnected && connectedWalletChainId === base.id ? connectedWalletAddressString : undefined;

  const connectedWallets = useMemo<Record<Chain, ChainAddress | undefined>>(
    () => ({
      [Chain.TON]: tonConnectWalletAddressString
        ? {
            chain: {
              $case: Chain.TON,
              value: tonConnectWalletAddressString,
            },
          }
        : undefined,
      [Chain.BASE]: baseWalletAddressString
        ? {
            chain: {
              $case: Chain.BASE,
              value: baseWalletAddressString,
            },
          }
        : undefined,
    }),
    [tonConnectWalletAddressString, baseWalletAddressString],
  );

  return connectedWallets;
}
