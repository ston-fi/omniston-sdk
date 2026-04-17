"use client";

import { Omniston, OmnistonProvider } from "@ston-fi/omniston-sdk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef } from "react";

import { AssetsProvider } from "./assets";
import { SwapFormProvider } from "./swap-form";
import { SwapSettingsProvider } from "./swap-settings";
import { TonConnectProvider } from "./ton-connect";
import { TradeTrackProvider } from "./trade-track";
import { WalletConnectProvider } from "./wallet-connect";

export function Providers({
  children,
  omnistonApiUrl,
  tonConnectManifestUrl,
  walletConnectProjectId,
}: {
  children: React.ReactNode;
  omnistonApiUrl: string;
  tonConnectManifestUrl: string;
  walletConnectProjectId: string;
}) {
  const queryClient = useRef(new QueryClient());

  const omniston = useRef(
    new Omniston({
      apiUrl: omnistonApiUrl,
      logger: console,
    }),
  );

  return (
    <QueryClientProvider client={queryClient.current}>
      <TonConnectProvider manifestUrl={tonConnectManifestUrl}>
        <WalletConnectProvider projectId={walletConnectProjectId}>
          <OmnistonProvider omniston={omniston.current}>
            <AssetsProvider>
              <SwapSettingsProvider>
                <SwapFormProvider>
                  <TradeTrackProvider>{children}</TradeTrackProvider>
                </SwapFormProvider>
              </SwapSettingsProvider>
            </AssetsProvider>
          </OmnistonProvider>
        </WalletConnectProvider>
      </TonConnectProvider>
    </QueryClientProvider>
  );
}
