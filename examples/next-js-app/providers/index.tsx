"use client";

import { TonConnectProvider } from "./ton-connect";
import { QueryProvider } from "./query";
import { OmnistonProvider } from "./omniston";
import { SwapSettingsProvider } from "./swap-settings";
import { SwapFormProvider } from "./swap-form";

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
