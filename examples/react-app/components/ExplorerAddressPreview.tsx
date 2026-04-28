import { ExternalLink } from "lucide-react";
import type { ChainAddress } from "@ston-fi/omniston-sdk-react";
import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { Chain } from "@/models/chain";

interface ExplorerAddressPreviewProps extends Omit<
  React.ComponentProps<"a">,
  "href" | "target" | "rel"
> {
  address: ChainAddress;
}

export const ExplorerAddressPreview = ({
  address,
  className,
  children,
  ...props
}: ExplorerAddressPreviewProps) => {
  const previewLink = useMemo(() => {
    switch (address.chain.$case) {
      case Chain.TON: {
        return `https://tonviewer.com/address/${address.chain.value}`;
      }
      case Chain.BASE: {
        return `https://basescan.org/address/${address.chain.value}`;
      }
      case Chain.POLYGON: {
        return `https://polygonscan.com/address/${address.chain.value}`;
      }
      default: {
        throw new Error(`Unexpected chain: ${address.chain.$case}`);
      }
    }
  }, [address]);

  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      href={previewLink}
      className={cn("flex gap-1 items-center hover:text-primary", className)}
    >
      {children}
      <ExternalLink size={16} className="size-[16px] shrink-0" />
    </a>
  );
};
