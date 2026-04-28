"use client";

import { createAppKit } from "@reown/appkit/react";
import { base, polygon } from "@reown/appkit/networks";
import React, { useEffect, useRef } from "react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { WagmiProvider } from "wagmi";

let isAppKitCreated = false;

export function WalletConnectProvider({
  children,
  projectId,
}: {
  children: React.ReactNode;
  projectId: string;
}) {
  const wagmiAdapter = useRef(
    new WagmiAdapter({
      networks: [base, polygon],
      projectId,
    }),
  );

  useEffect(() => {
    if (isAppKitCreated) return;

    createAppKit({
      adapters: [wagmiAdapter.current],
      networks: [base, polygon],
      projectId,
      showWallets: true,
      defaultNetwork: base,
      themeMode: "light",
    });

    isAppKitCreated = true;
  }, [projectId]);

  return <WagmiProvider config={wagmiAdapter.current.wagmiConfig}>{children}</WagmiProvider>;
}
