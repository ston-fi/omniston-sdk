"use client";

import { OmnistonProvider } from "./omniston";
import { QueryProvider } from "./query";
import { SwapFormProvider } from "./swap-form";
import { SwapSettingsProvider } from "./swap-settings";
import { TonConnectProvider } from "./ton-connect";
import { TrackingQuoteProvider } from "./tracking-quote";

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
            <SwapFormProvider>
              <TrackingQuoteProvider>{children}</TrackingQuoteProvider>
            </SwapFormProvider>
          </SwapSettingsProvider>
        </OmnistonProvider>
      </QueryProvider>
    </TonConnectProvider>
  );
}
