"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const ReactQueryDevtools = React.lazy(() =>
  import("@tanstack/react-query-devtools").then((module) => ({
    default: module.ReactQueryDevtools,
  })),
);

const queryClient = new QueryClient();

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <React.Suspense>
          <ReactQueryDevtools />
        </React.Suspense>
      )}
    </QueryClientProvider>
  );
}
