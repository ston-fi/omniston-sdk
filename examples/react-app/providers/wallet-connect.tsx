"use client";

import { createAppKit } from "@reown/appkit/react";
import { WalletProvider as TronWalletProvider } from "@tronweb3/tronwallet-adapter-react-hooks";
import { MetaMaskAdapter, TronLinkAdapter } from "@tronweb3/tronwallet-adapters";
import {
  arbitrum,
  avalanche,
  base,
  bsc,
  mainnet,
  polygon,
  tronMainnet,
  tronNileTestnet,
  robinhood,
  xLayer,
  type AppKitNetwork,
} from "@reown/appkit/networks";
import { useEffect, useMemo, useRef, useState } from "react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { TronAdapter } from "@reown/appkit-adapter-tron";
import { WagmiProvider } from "wagmi";

import { useAppConfig } from "~/providers/config";

let isAppKitCreated = false;

export function WalletConnectProvider({
  children,
  projectId,
}: {
  children: React.ReactNode;
  projectId: string;
}) {
  const {
    tronConfig: { network: tronNetwork },
  } = useAppConfig();

  const evmNetworks = useMemo(
    () =>
      [arbitrum, avalanche, mainnet, base, polygon, bsc, robinhood, xLayer] satisfies [
        AppKitNetwork,
        ...AppKitNetwork[],
      ],
    [],
  );

  const tronNetworkConfig = useMemo(() => {
    switch (tronNetwork) {
      case "mainnet": {
        return tronMainnet;
      }
      case "nile": {
        return tronNileTestnet;
      }
      default: {
        tronNetwork satisfies never;
        throw new Error(`Unexpected tron network: ${tronNetwork}`);
      }
    }
  }, [tronNetwork]);

  const wagmiAdapter = useRef(
    new WagmiAdapter({
      networks: evmNetworks,
      projectId,
      ssr: true,
    }),
  );
  const tronLinkAdapter = useRef(new TronLinkAdapter());

  const [isAppKitReady, setIsAppKitReady] = useState(isAppKitCreated);

  useEffect(() => {
    if (!isAppKitCreated) {
      const tronAdapter = new TronAdapter({
        walletAdapters: [tronLinkAdapter.current, new MetaMaskAdapter()],
      });

      createAppKit({
        adapters: [wagmiAdapter.current, tronAdapter],
        networks: [...evmNetworks, tronNetworkConfig],
        projectId,
        showWallets: true,
        defaultNetwork: base,
        themeMode: "light",
      });

      isAppKitCreated = true;
    }

    setIsAppKitReady(true);
  }, [evmNetworks, projectId, tronNetworkConfig]);

  return (
    <WagmiProvider config={wagmiAdapter.current.wagmiConfig}>
      <TronWalletProvider adapters={[tronLinkAdapter.current]} autoConnect={false}>
        {isAppKitReady ? children : null}
      </TronWalletProvider>
    </WagmiProvider>
  );
}
