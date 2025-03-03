"use client";

import { OmnistonProvider as _OmnistonProvider } from "@ston-fi/omniston-sdk-react";
import { useQueryClient } from "@tanstack/react-query";

export function OmnistonProvider({
  children,
  apiUrl,
}: { children: React.ReactNode; apiUrl: string }) {
  const queryClient = useQueryClient();

  return (
    <_OmnistonProvider
      queryClient={queryClient}
      apiUrl={apiUrl}
      logger={console}
    >
      {children}
    </_OmnistonProvider>
  );
}
