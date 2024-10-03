"use client";

import * as React from "react";
import { Omniston, type IOmnistonDependencies } from "@ston-fi/omniston-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ObservableRefCountCache } from "./ObservableRefCountCache";
import { ObservableRefCountCacheContext } from "./ObservableRefCountCacheContext";

export const OmnistonContext = React.createContext<Omniston | null>(null);

interface OmnistonProviderProps extends IOmnistonDependencies {
  /**
   * Provide a queryClient instance to use in Omniston hooks.
   */
  queryClient?: QueryClient;
  children: React.ReactNode;
}

/**
 * Place it at the root of your app to use {@link useOmniston()}
 */
export const OmnistonProvider: React.FC<OmnistonProviderProps> =
  function OmnistonProvider({
    children,
    queryClient: queryClientProp,
    ...omnistonProps
  }) {
    const [omniston, setOmniston] = React.useState(
      () => new Omniston(omnistonProps),
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies:
    const queryClient = React.useMemo(
      () => queryClientProp ?? new QueryClient(),
      [!!queryClientProp],
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies:
    React.useEffect(() => {
      setOmniston(new Omniston(omnistonProps));
    }, [JSON.stringify(omnistonProps)]);

    React.useEffect(() => () => omniston.close(), [omniston]);

    const observableRefCountCacheRef = React.useRef(
      new ObservableRefCountCache(),
    );

    return (
      <OmnistonContext.Provider value={omniston}>
        <QueryClientProvider client={queryClient}>
          <ObservableRefCountCacheContext.Provider
            value={observableRefCountCacheRef.current}
          >
            {children}
          </ObservableRefCountCacheContext.Provider>
        </QueryClientProvider>
      </OmnistonContext.Provider>
    );
  };
