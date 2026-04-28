import { useTonAddress } from "@tonconnect/ui-react";
import { useMemo } from "react";
import { useAccount } from "wagmi";
import type { ChainAddress } from "@ston-fi/omniston-sdk-react";

import { Chain } from "@/models/chain";

const WalletNamespace = {
  TON: "ton",
  EVM: "evm",
} as const;

type WalletNamespace = (typeof WalletNamespace)[keyof typeof WalletNamespace];

const walletNamespaceByChain: Record<Chain, WalletNamespace> = {
  [Chain.TON]: WalletNamespace.TON,
  [Chain.BASE]: WalletNamespace.EVM,
  [Chain.POLYGON]: WalletNamespace.EVM,
};

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
  const { address: evmWalletAddressString, isConnected: isEvmConnected } = useAccount();

  const addressByNamespace = useMemo<Record<WalletNamespace, string | undefined>>(
    () => ({
      [WalletNamespace.TON]: tonConnectWalletAddressString || undefined,
      [WalletNamespace.EVM]:
        isEvmConnected && evmWalletAddressString ? evmWalletAddressString : undefined,
    }),
    [tonConnectWalletAddressString, isEvmConnected, evmWalletAddressString],
  );

  const connectedWallets = useMemo<Record<Chain, ChainAddress | undefined>>(() => {
    const tonWalletAddressString = addressByNamespace[walletNamespaceByChain[Chain.TON]];
    const baseWalletAddressString = addressByNamespace[walletNamespaceByChain[Chain.BASE]];
    const polygonWalletAddressString = addressByNamespace[walletNamespaceByChain[Chain.POLYGON]];

    return {
      [Chain.TON]: tonWalletAddressString
        ? createChainAddress(Chain.TON, tonWalletAddressString)
        : undefined,
      [Chain.BASE]: baseWalletAddressString
        ? createChainAddress(Chain.BASE, baseWalletAddressString)
        : undefined,
      [Chain.POLYGON]: polygonWalletAddressString
        ? createChainAddress(Chain.POLYGON, polygonWalletAddressString)
        : undefined,
    } satisfies Record<Chain, ChainAddress | undefined>;
  }, [addressByNamespace]);

  return connectedWallets;
}
