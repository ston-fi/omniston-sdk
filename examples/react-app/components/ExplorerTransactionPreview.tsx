import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import { Chain } from "@/models/chain";

interface ExplorerTransactionPreviewProps extends Omit<
  React.ComponentProps<"a">,
  "href" | "target" | "rel"
> {
  chain: Chain;
  txId: string;
}

const transactionPreviewLinkByChain = {
  [Chain.TON]: (txId) => `https://tonviewer.com/transaction/${txId}`,
  [Chain.BASE]: (txId) => `https://basescan.org/tx/${txId}`,
} satisfies Record<Chain, (txId: string) => string>;

export const ExplorerTransactionPreview = ({
  txId,
  chain,
  className,
  children,
  ...props
}: ExplorerTransactionPreviewProps) => {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      href={transactionPreviewLinkByChain[chain](txId)}
      className={cn("flex gap-1 items-center hover:text-primary", className)}
    >
      {children}
      <ExternalLink size={16} className="size-[16px] shrink-0" />
    </a>
  );
};
