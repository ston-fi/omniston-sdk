import { useTonAddress } from "@tonconnect/ui-react";
import { useMemo } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import type { ChainAddress } from "@ston-fi/omniston-sdk-react";

import { useTronWalletConnection } from "~/hooks/useTronWalletConnection";
import { Chain } from "~/models/chain";
import { getChainFamilyByChain } from "~/models/chain-family";
import { ChainFamily } from "~/models/chain-family";

function createChainAddress(chain: Chain, value: string): ChainAddress {
  return {
    chain: {
      $case: chain,
      value,
    },
  };
}

export function useConnectedWallets() {
  const tonConnectWalletAddressString = useTonAddress();
  const { address: evmWalletAddressString, isConnected: isEvmConnected } = useAppKitAccount({
    namespace: "eip155",
  });

  const { address: tronWalletAddressString } = useTronWalletConnection();

  const addressByChainFamily = useMemo<Record<ChainFamily, string | undefined>>(
    () => ({
      [ChainFamily.TON]: tonConnectWalletAddressString || undefined,
      [ChainFamily.EVM]:
        isEvmConnected && evmWalletAddressString ? evmWalletAddressString : undefined,
      [ChainFamily.TRON]: tronWalletAddressString,
    }),
    [
      tonConnectWalletAddressString,
      isEvmConnected,
      evmWalletAddressString,
      tronWalletAddressString,
    ],
  );

  const connectedWallets = useMemo<Record<Chain, ChainAddress | undefined>>(() => {
    return (Object.values(Chain) as Chain[]).reduce<Record<Chain, ChainAddress | undefined>>(
      (acc, chain) => {
        const walletAddressString = addressByChainFamily[getChainFamilyByChain(chain)];

        acc[chain] = walletAddressString
          ? createChainAddress(chain, walletAddressString)
          : undefined;

        return acc;
      },
      {} as Record<Chain, ChainAddress | undefined>,
    );
  }, [addressByChainFamily]);

  return connectedWallets;
}
