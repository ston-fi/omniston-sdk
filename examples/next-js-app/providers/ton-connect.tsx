"use client";

import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";

export function TonConnectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TonConnectUIProvider
      uiPreferences={{
        borderRadius: "s",
        theme: THEME.LIGHT,
      }}
      manifestUrl="https://omniston.ston.fi/tonconnect-manifest.json"
    >
      {children}
    </TonConnectUIProvider>
  );
}
