"use client";

import { createContext, useContext, useMemo } from "react";

export interface AppConfig {}

const AppConfigContext = createContext<AppConfig | undefined>(undefined);

export interface AppConfigProviderProps extends React.PropsWithChildren {}

export function AppConfigProvider({ children }: AppConfigProviderProps) {
  const value = useMemo(() => {
    return {};
  }, []);

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);

  if (!context) {
    throw new Error("useAppConfig must be used within an AppConfigProvider");
  }

  return context;
}
