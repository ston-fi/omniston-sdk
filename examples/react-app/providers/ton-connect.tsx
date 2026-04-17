"use client";

import { THEME, TonConnectUIProvider } from "@tonconnect/ui-react";

export function TonConnectProvider({
  children,
  manifestUrl,
}: React.PropsWithChildren<{
  manifestUrl: string;
}>) {
  return (
    <TonConnectUIProvider
      uiPreferences={{
        borderRadius: "s",
        theme: THEME.LIGHT,
      }}
      analytics={{
        mode: "off",
      }}
      manifestUrl={manifestUrl}
    >
      {children}
    </TonConnectUIProvider>
  );
}
