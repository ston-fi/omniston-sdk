"use client";

import { TonConnectButton } from "@tonconnect/ui-react";

import { Badge } from "./ui/badge";

export function Header() {
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background justify-between">
      <section className="container flex items-center justify-between">
        <a
          href="https://ston.fi/"
          target="_blank"
          className="flex text-xl hover:opacity-80 transition-opacity relative w-max"
        >
          <pre>Omniston</pre>
          <Badge className="absolute rotate-[-13deg] -right-8 -bottom-3 scale-[0.8]">
            demo
          </Badge>
        </a>

        <TonConnectButton />
      </section>
    </header>
  );
}
