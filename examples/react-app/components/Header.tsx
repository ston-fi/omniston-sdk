"use client";

import { TonConnectButton } from "@tonconnect/ui-react";
import { AppKitButton } from "@reown/appkit/react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import GitBookIcon from "@/public/icons/gitbook.svg";
import GitHubIcon from "@/public/icons/github.svg";

export function Header() {
  return (
    <header className="bg-background sticky top-0 z-[10] flex h-16 items-center justify-between gap-4 border-b">
      <section className="container flex items-center gap-4">
        <a
          href="https://ston.fi"
          target="_blank noopener noreferrer"
          className="relative mr-auto transition-opacity hover:opacity-80"
        >
          <Image
            src="https://static.ston.fi/branbook/omniston/logo/black.svg"
            width={180}
            height={60}
            alt="logo"
          />
          <Badge className="absolute -right-7 bottom-1 scale-[0.8] rotate-[-13deg]">example</Badge>
        </a>

        <AppKitButton size="md" balance="hide" />
        <TonConnectButton />
        <a
          href="https://github.com/ston-fi/omniston-sdk"
          target="_blank noopener noreferrer"
          className="transition-opacity hover:opacity-60"
        >
          <Image src={GitHubIcon} alt="GitHub" width={24} height={24} />
        </a>
        <a
          href="https://docs.ston.fi/docs/developer-section/omniston"
          target="_blank noopener noreferrer"
          className="transition-opacity hover:opacity-60"
        >
          <Image src={GitBookIcon} alt="GitBook" width={24} height={24} />
        </a>
      </section>
    </header>
  );
}
