"use client";

import { ChevronDown } from "lucide-react";
import { type FC, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AssetInfo } from "@/constants/assets";

type AssetSelectProps = {
  assets?: AssetInfo[];
  selectedAsset: AssetInfo | null;
  onAssetSelect?: (asset: AssetInfo | null) => void;
  className?: string;
  loading?: boolean;
};

export const AssetSelect: FC<AssetSelectProps> = ({
  assets = [],
  selectedAsset,
  onAssetSelect,
  loading,
  className,
}) => {
  const [open, setOpen] = useState(false);

  const handleAssetSelect = (assetAddress: string) => {
    const asset = assets.find((asset) => asset.address === assetAddress);

    if (asset && onAssetSelect) {
      onAssetSelect(asset);
    }

    setOpen(false);
  };

  const handleFilter = (_: string, search: string, keywords: string[] = []) => {
    const [symbol = ""] = keywords;
    return symbol.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
  };

  if (loading) {
    return <Skeleton className={cn("w-full h-10", className)} />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full", className)}
        >
          {selectedAsset ? (
            <>
              <Avatar className="size-[20px] mr-2">
                <AvatarImage
                  src={selectedAsset.imageUrl}
                  alt={selectedAsset.name ?? selectedAsset.symbol}
                />
              </Avatar>
              {selectedAsset.symbol}
            </>
          ) : (
            "Select asset..."
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" avoidCollisions={false}>
        <Command filter={handleFilter}>
          <CommandInput placeholder="Search asset..." />
          <CommandList>
            <CommandEmpty>No asset found.</CommandEmpty>
            <CommandGroup>
              {assets.map((asset) => (
                <CommandItem
                  className="flex gap-2"
                  key={asset.address}
                  value={asset.address}
                  keywords={[asset.symbol]}
                  onSelect={handleAssetSelect}
                >
                  <Avatar className="w-6 h-6 aspect-square">
                    <AvatarImage
                      src={asset.imageUrl}
                      alt={asset.name ?? asset.symbol}
                    />
                    <AvatarFallback>
                      <Skeleton className="rounded-full" />
                    </AvatarFallback>
                  </Avatar>
                  {asset.symbol}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
