import { ExternalLink } from "lucide-react";

import { useExplorer } from "@/hooks/useExplorer";
import { cn } from "@/lib/utils";

interface ExplorerTransactionPreviewProps
  extends Omit<React.ComponentProps<"a">, "href" | "target" | "rel"> {
  txId: string;
}

export const ExplorerTransactionPreview = ({
  txId,
  className,
  children,
  ...props
}: ExplorerTransactionPreviewProps) => {
  const { transactionPreviewUrl } = useExplorer();

  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={transactionPreviewUrl(txId).toString()}
      className={cn("flex gap-1 items-center hover:text-primary", className)}
      {...props}
    >
      {children}
      <ExternalLink size={16} className="size-[16px] shrink-0" />
    </a>
  );
};
