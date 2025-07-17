"use client";

import type { Omniston } from "@ston-fi/omniston-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";

import { ObservableRefCountCache } from "./ObservableRefCountCache";
import { ObservableRefCountCacheContext } from "./ObservableRefCountCacheContext";

export const OmnistonContext = React.createContext<Omniston | null>(null);

interface OmnistonProviderProps {
  omniston: Omniston;
  children: React.ReactNode;
}

/**
 * Place it at the root of your app to use {@link useOmniston()}
 */
export const OmnistonProvider: React.FC<OmnistonProviderProps> =
  function OmnistonProvider({ children, omniston }) {
    // biome-ignore lint/correctness/useExhaustiveDependencies: need to recreate for each Omniston instance
    const observableRefCountCache = React.useMemo(
      () => new ObservableRefCountCache(),
      [omniston],
    );

    const queryClient = React.useMemo(() => new QueryClient(), []);

    return (
      <OmnistonContext.Provider value={omniston}>
        <QueryClientProvider client={queryClient}>
          <ObservableRefCountCacheContext.Provider
            value={observableRefCountCache}
          >
            {children}
          </ObservableRefCountCacheContext.Provider>
        </QueryClientProvider>
      </OmnistonContext.Provider>
    );
  };
