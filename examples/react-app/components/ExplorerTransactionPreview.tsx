import { useMemo } from "react";
import { ExternalLink } from "lucide-react";

import { useAppConfig } from "~/providers/config";
import { cn } from "~/lib/utils";
import { Chain } from "~/models/chain";

interface ExplorerTransactionPreviewProps extends Omit<
  React.ComponentProps<"a">,
  "href" | "target" | "rel"
> {
  chain: Chain;
  txId: string;
}

export const ExplorerTransactionPreview = ({
  txId,
  chain,
  className,
  children,
  ...props
}: ExplorerTransactionPreviewProps) => {
  const {
    tronConfig: { explorerUrl: tronExplorerUrl },
  } = useAppConfig();

  const link = useMemo(() => {
    switch (chain) {
      case Chain.ARBITRUM: {
        return `https://arbiscan.io/tx/${txId}`;
      }
      case Chain.AVALANCHE: {
        return `https://snowtrace.io/tx/${txId}`;
      }
      case Chain.BASE: {
        return `https://basescan.org/tx/${txId}`;
      }
      case Chain.BNB: {
        return `https://bscscan.com/tx/${txId}`;
      }
      case Chain.ETHEREUM: {
        return `https://etherscan.io/tx/${txId}`;
      }
      case Chain.POLYGON: {
        return `https://polygonscan.com/tx/${txId}`;
      }
      case Chain.ROBINHOOD: {
        return `https://robinhoodchain.blockscout.com/tx/${txId}`;
      }
      case Chain.TON: {
        return `https://tonviewer.com/transaction/${txId}`;
      }
      case Chain.TRON: {
        return `${tronExplorerUrl}/#/transaction/${txId}`;
      }
      default: {
        chain satisfies never;
        throw new Error(`Unexpected chain: ${chain}`);
      }
    }
  }, [chain, txId, tronExplorerUrl]);

  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      href={link}
      className={cn("flex gap-1 items-center hover:text-primary", className)}
    >
      {children}
      <ExternalLink className="size-4 shrink-0" />
    </a>
  );
};
