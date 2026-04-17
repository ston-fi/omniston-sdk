import type { Omniston } from "@ston-fi/omniston-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, type PropsWithChildren, useRef } from "react";

export const OmnistonContext = createContext<Omniston | null>(null);

export interface OmnistonProviderProps {
  /**
   * Omniston instance
   *
   * Will be exposed via `useOmniston()` hook
   */
  omniston: Omniston;
  /**
   * Optional app-level TanStack Query client
   *
   * When set, OmnistonProvider will not create its own QueryClient and will use the provided one instead
   */
  queryClient?: QueryClient;
}

export const OmnistonProvider = ({
  children,
  omniston,
  queryClient,
}: PropsWithChildren<OmnistonProviderProps>) => {
  const internalQueryClientRef = useRef<QueryClient | null>(null);

  const getInternalQueryClient = () => {
    if (!internalQueryClientRef.current) {
      internalQueryClientRef.current = new QueryClient();
    }

    return internalQueryClientRef.current;
  };

  if (queryClient) {
    return <OmnistonContext.Provider value={omniston}>{children}</OmnistonContext.Provider>;
  }

  return (
    <OmnistonContext.Provider value={omniston}>
      <QueryClientProvider client={getInternalQueryClient()}>{children}</QueryClientProvider>
    </OmnistonContext.Provider>
  );
};
