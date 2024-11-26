"use client";

import { OmnistonProvider } from "./omniston";
import { QueryProvider } from "./query";
import { SwapFormProvider } from "./swap-form";
import { SwapSettingsProvider } from "./swap-settings";
import { TonConnectProvider } from "./ton-connect";

export function Providers({
  children,
  omnistonApiUrl,
}: {
  children: React.ReactNode;
  omnistonApiUrl: string;
}) {
  return (
    <TonConnectProvider>
      <QueryProvider>
        <OmnistonProvider apiUrl={omnistonApiUrl}>
          <SwapSettingsProvider>
            <SwapFormProvider>{children}</SwapFormProvider>
          </SwapSettingsProvider>
        </OmnistonProvider>
      </QueryProvider>
    </TonConnectProvider>
  );
}
