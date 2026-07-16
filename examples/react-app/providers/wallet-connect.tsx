"use client";

import { createAppKit } from "@reown/appkit/react";
import {
  arbitrum,
  avalanche,
  base,
  bsc,
  mainnet,
  polygon,
  type AppKitNetwork,
} from "@reown/appkit/networks";
import { useEffect, useMemo, useRef, useState } from "react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { WagmiProvider } from "wagmi";

import { robinhood } from "~/lib/evm/custom-chains";

let isAppKitCreated = false;

export function WalletConnectProvider({
  children,
  projectId,
}: {
  children: React.ReactNode;
  projectId: string;
}) {
  const evmNetworks = useMemo(
    () =>
      [arbitrum, avalanche, mainnet, base, polygon, bsc, robinhood] satisfies [
        AppKitNetwork,
        ...AppKitNetwork[],
      ],
    [],
  );

  const wagmiAdapter = useRef(
    new WagmiAdapter({
      networks: evmNetworks,
      projectId,
      ssr: true,
    }),
  );

  const [isAppKitReady, setIsAppKitReady] = useState(isAppKitCreated);

  useEffect(() => {
    if (!isAppKitCreated) {
      createAppKit({
        adapters: [wagmiAdapter.current],
        networks: evmNetworks,
        projectId,
        showWallets: true,
        defaultNetwork: base,
        themeMode: "light",
      });

      isAppKitCreated = true;
    }

    setIsAppKitReady(true);
  }, [evmNetworks, projectId]);

  return (
    <WagmiProvider config={wagmiAdapter.current.wagmiConfig}>
      {isAppKitReady ? children : null}
    </WagmiProvider>
  );
}
