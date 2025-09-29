import { ExternalLink } from "lucide-react";

import { useExplorer } from "@/hooks/useExplorer";
import { cn } from "@/lib/utils";

interface AddressPreviewProps
  extends Omit<React.ComponentProps<"a">, "href" | "target" | "rel"> {
  address: string;
}

export const AddressPreview = ({
  address,
  className,
  children,
  ...props
}: AddressPreviewProps) => {
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
      <ExternalLink size={16} />
    </a>
  );
};
