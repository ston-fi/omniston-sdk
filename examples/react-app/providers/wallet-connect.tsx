"use client";

import { createAppKit } from "@reown/appkit/react";
import { base, mainnet, polygon, type AppKitNetwork } from "@reown/appkit/networks";
import React, { useEffect, useRef } from "react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { WagmiProvider } from "wagmi";

let isAppKitCreated = false;

const networks = [mainnet, base, polygon] satisfies [AppKitNetwork, ...AppKitNetwork[]];

export function WalletConnectProvider({
  children,
  projectId,
}: {
  children: React.ReactNode;
  projectId: string;
}) {
  const wagmiAdapter = useRef(
    new WagmiAdapter({
      networks,
      projectId,
    }),
  );

  useEffect(() => {
    if (isAppKitCreated) return;

    createAppKit({
      adapters: [wagmiAdapter.current],
      networks,
      projectId,
      showWallets: true,
      defaultNetwork: base,
      themeMode: "light",
    });

    isAppKitCreated = true;
  }, [projectId]);

  return <WagmiProvider config={wagmiAdapter.current.wagmiConfig}>{children}</WagmiProvider>;
}
