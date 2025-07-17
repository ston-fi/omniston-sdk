"use client";

import { Omniston, OmnistonProvider } from "@ston-fi/omniston-sdk-react";
import { useMemo } from "react";

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
  const omniston = useMemo(
    () => new Omniston({ apiUrl: omnistonApiUrl, logger: console }),
    [omnistonApiUrl],
  );

  return (
    <TonConnectProvider>
      <QueryProvider>
        <OmnistonProvider omniston={omniston}>
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
