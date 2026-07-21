"use client";

import { createContext, useContext, useMemo } from "react";

import type { TronConfig } from "~/lib/tron/config";

export interface AppConfig {
  tronConfig: TronConfig;
}

const AppConfigContext = createContext<AppConfig | undefined>(undefined);

export interface AppConfigProviderProps extends React.PropsWithChildren {
  tronConfig: TronConfig;
}

export function AppConfigProvider({ children, tronConfig }: AppConfigProviderProps) {
  const value = useMemo(() => {
    return {
      tronConfig,
    };
  }, [tronConfig]);

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);

  if (!context) {
    throw new Error("useAppConfig must be used within an AppConfigProvider");
  }

  return context;
}
