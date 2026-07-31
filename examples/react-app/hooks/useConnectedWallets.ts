import { useIsConnectionRestored, useTonAddress } from "@tonconnect/ui-react";
import { useMemo } from "react";
import { useAppKitAccount, useAppKitState } from "@reown/appkit/react";
import type { ChainAddress } from "@ston-fi/omniston-sdk-react";

import { useTronWalletConnection } from "~/hooks/useTronWalletConnection";
import { Chain } from "~/models/chain";
import { ChainFamily, getChainFamilyByChain } from "~/models/chain-family";

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
  const isTonConnectionRestored = useIsConnectionRestored();
  const { initialized: isAppKitInitialized } = useAppKitState();
  const {
    address: evmWalletAddressString,
    isConnected: isEvmConnected,
    status: evmConnectionStatus,
  } = useAppKitAccount({
    namespace: "eip155",
  });

  const {
    address: tronWalletAddressString,
    appKitStatus: tronAppKitConnectionStatus,
    tronLinkWallet,
  } = useTronWalletConnection();

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

  const walletAddressByChain = useMemo<Record<Chain, ChainAddress | undefined>>(() => {
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

  const isAppKitConnectionRestored = (
    status: typeof evmConnectionStatus | typeof tronAppKitConnectionStatus,
  ) => isAppKitInitialized && status !== "connecting" && status !== "reconnecting";

  const isConnectionRestoredByChainFamily = {
    [ChainFamily.TON]: isTonConnectionRestored,
    [ChainFamily.EVM]: isAppKitConnectionRestored(evmConnectionStatus),
    [ChainFamily.TRON]:
      isAppKitConnectionRestored(tronAppKitConnectionStatus) &&
      !tronLinkWallet.connecting &&
      !tronLinkWallet.disconnecting,
  } satisfies Record<ChainFamily, boolean>;

  const isWalletRestoredByChain = (Object.values(Chain) as Chain[]).reduce<Record<Chain, boolean>>(
    (acc, chain) => {
      acc[chain] = isConnectionRestoredByChainFamily[getChainFamilyByChain(chain)];

      return acc;
    },
    {} as Record<Chain, boolean>,
  );

  return {
    walletAddressByChain,
    isWalletRestoredByChain,
  };
}
