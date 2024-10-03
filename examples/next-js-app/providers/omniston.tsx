"use client";

import { useQueryClient } from "@tanstack/react-query";
import { OmnistonProvider as _OmnistonProvider } from "@ston-fi/omniston-sdk-react";

export function OmnistonProvider({
  children,
  apiUrl,
}: { children: React.ReactNode; apiUrl: string }) {
  const queryClient = useQueryClient();

  return (
    <_OmnistonProvider queryClient={queryClient} apiUrl={apiUrl}>
      {children}
    </_OmnistonProvider>
  );
}
