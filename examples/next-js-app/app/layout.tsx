import { unstable_noStore as noStore } from "next/cache";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

import { Providers } from "@/providers";
import { Header } from "@/components/Header";

import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Swap via Ston.fi",
  description: "Demo app to demonstrate how to swap tokens via Ston.fi SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  noStore();

  return (
    <html lang="en">
      <body className={cn(inter.className, "flex flex-col min-h-[100svh]")}>
        <Analytics />
        <Providers
          omnistonApiUrl={
            process.env.NEXT_PUBLIC_OMNISTON_API_URL ?? "wss://omni-ws.ston.fi"
          }
        >
          <Header />
          <main className="container flex flex-col flex-1 h-full py-10">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
