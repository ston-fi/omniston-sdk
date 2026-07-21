import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { Inter } from "next/font/google";

import { Header } from "~/components/Header";
import { cn, retrieveEnvVariable } from "~/lib/utils";
import { tronConfigSchema } from "~/lib/tron/config";
import { Providers } from "~/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Omniston example app",
  description: "Example app showcasing the usage of the Omniston SDK",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  noStore();

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://static.ston.fi/favicon/favicon.ico" />
      </head>
      <body className={cn(inter.className, "flex flex-col min-h-svh")}>
        <Providers
          omnistonApiUrl={retrieveEnvVariable("OMNIDEMO__OMNISTON__API_URL")}
          tonConnectManifestUrl={retrieveEnvVariable("OMNIDEMO__TONCONNECT__MANIFEST_URL")}
          walletConnectProjectId={retrieveEnvVariable("OMNIDEMO__WALLET_CONNECT__PROJECT_ID")}
          tronConfig={tronConfigSchema.parse({
            network: retrieveEnvVariable("OMNIDEMO__TRON__NETWORK"),
            rpcUrl: retrieveEnvVariable("OMNIDEMO__TRON__RPC_URL"),
            explorerUrl: retrieveEnvVariable("OMNIDEMO__TRON__EXPLORER_URL"),
          })}
        >
          <Header />
          <main className="container flex h-full flex-1 flex-col py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
