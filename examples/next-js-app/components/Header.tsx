"use client";

import { TonConnectButton } from "@tonconnect/ui-react";
import Image from "next/image";

// TODO: for some reason, the TS in our CI is failing with the following error:
// TS2307: Cannot find module '../public/logo.svg' or its corresponding type declarations.
// For now, we are ignoring this error because the code works and with the local ts setup, it works as well
// @ts-ignore
import logo from "@/public/logo.svg";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background justify-between">
      <section className="container flex items-center justify-between">
        <a
          href="https://ston.fi/"
          target="_blank"
          className="flex text-xl hover:opacity-80 transition-opacity relative w-max"
        >
          <Image src={logo} alt="logo" />
          <Badge className="absolute rotate-[-13deg] -right-8 -bottom-3 scale-[0.8]">
            demo
          </Badge>
        </a>

        <TonConnectButton className="ml-[36px]" />
      </section>
    </header>
  );
}
