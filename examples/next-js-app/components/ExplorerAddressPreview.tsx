import { ExternalLink } from "lucide-react";

import { useExplorer } from "@/hooks/useExplorer";
import { cn } from "@/lib/utils";

interface ExplorerAddressPreviewProps
  extends Omit<React.ComponentProps<"a">, "href" | "target" | "rel"> {
  address: string;
}

export const ExplorerAddressPreview = ({
  address,
  className,
  children,
  ...props
}: ExplorerAddressPreviewProps) => {
  const { addressPreviewUrl } = useExplorer();

  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={addressPreviewUrl(address).toString()}
      className={cn("flex gap-1 items-center hover:text-primary", className)}
      {...props}
    >
      {children}
      <ExternalLink size={16} className="size-[16px] shrink-0" />
    </a>
  );
};
