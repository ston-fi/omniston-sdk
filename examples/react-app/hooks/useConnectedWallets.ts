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
  [Chain.ARBITRUM]: WalletNamespace.EVM,
  [Chain.AVALANCHE]: WalletNamespace.EVM,
  [Chain.BASE]: WalletNamespace.EVM,
  [Chain.BNB]: WalletNamespace.EVM,
  [Chain.ETHEREUM]: WalletNamespace.EVM,
  [Chain.POLYGON]: WalletNamespace.EVM,
  [Chain.TON]: WalletNamespace.TON,
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
    const arbitrumWalletAddressString = addressByNamespace[walletNamespaceByChain[Chain.ARBITRUM]];
    const avalancheWalletAddressString =
      addressByNamespace[walletNamespaceByChain[Chain.AVALANCHE]];
    const baseWalletAddressString = addressByNamespace[walletNamespaceByChain[Chain.BASE]];
    const bnbWalletAddressString = addressByNamespace[walletNamespaceByChain[Chain.BNB]];
    const ethereumWalletAddressString = addressByNamespace[walletNamespaceByChain[Chain.ETHEREUM]];
    const polygonWalletAddressString = addressByNamespace[walletNamespaceByChain[Chain.POLYGON]];
    const tonWalletAddressString = addressByNamespace[walletNamespaceByChain[Chain.TON]];

    return {
      [Chain.ARBITRUM]: arbitrumWalletAddressString
        ? createChainAddress(Chain.ARBITRUM, arbitrumWalletAddressString)
        : undefined,
      [Chain.AVALANCHE]: avalancheWalletAddressString
        ? createChainAddress(Chain.AVALANCHE, avalancheWalletAddressString)
        : undefined,
      [Chain.BASE]: baseWalletAddressString
        ? createChainAddress(Chain.BASE, baseWalletAddressString)
        : undefined,
      [Chain.BNB]: bnbWalletAddressString
        ? createChainAddress(Chain.BNB, bnbWalletAddressString)
        : undefined,
      [Chain.ETHEREUM]: ethereumWalletAddressString
        ? createChainAddress(Chain.ETHEREUM, ethereumWalletAddressString)
        : undefined,
      [Chain.POLYGON]: polygonWalletAddressString
        ? createChainAddress(Chain.POLYGON, polygonWalletAddressString)
        : undefined,
      [Chain.TON]: tonWalletAddressString
        ? createChainAddress(Chain.TON, tonWalletAddressString)
        : undefined,
    } satisfies Record<Chain, ChainAddress | undefined>;
  }, [addressByNamespace]);

  return connectedWallets;
}
