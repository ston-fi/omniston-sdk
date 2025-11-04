"use client";

import { useQuery } from "@tanstack/react-query";
import { useTonAddress } from "@tonconnect/ui-react";
import { ChevronDown } from "lucide-react";
import { type FC, useEffect, useMemo, useState } from "react";

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
import { bigNumberToFloat, cn, trimStringWithEllipsis } from "@/lib/utils";
import type { AssetMetadata } from "@/models/asset";
import { useAssets } from "@/providers/assets";
import { assetQueryFactory } from "@/quries/assets";
import { ExplorerAddressPreview } from "./ExplorerAddressPreview";

type AssetSelectProps = {
  assets?: AssetMetadata[];
  selectedAsset: AssetMetadata | null;
  onAssetSelect?: (asset: AssetMetadata | null) => void;
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
  const walletAddress = useTonAddress();

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { insertAsset } = useAssets();

  const searchQuery = useQuery({
    ...assetQueryFactory.search({
      searchTerms: [searchTerm],
      walletAddress,
    }),
    enabled: searchTerm.length > 0,
  });

  const displayAssets = useMemo(() => {
    if (searchTerm.length > 0 && searchQuery.data) {
      return searchQuery.data;
    }

    return assets;
  }, [searchTerm, searchQuery.data, assets]);

  const handleAssetSelect = (assetAddress: string) => {
    const asset = displayAssets.find(
      (asset) => asset.contractAddress === assetAddress,
    );

    if (asset) {
      insertAsset(asset);
      onAssetSelect?.(asset);
    }

    setOpen(false);
    setSearchTerm("");
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
  };

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

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
                  src={selectedAsset.meta.imageUrl}
                  alt={
                    selectedAsset.meta.displayName ?? selectedAsset.meta.symbol
                  }
                />
              </Avatar>
              {selectedAsset.meta.symbol}
            </>
          ) : (
            "Select asset…"
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full min-w-[300px] p-0"
        avoidCollisions={false}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search asset…"
            value={searchTerm}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {searchTerm.length > 0 && searchQuery.isLoading && (
              <div className="p-2">
                <Skeleton className="h-4 w-full" />
              </div>
            )}
            <CommandEmpty>
              {searchTerm.length > 0 && searchQuery.isError
                ? "Error searching assets."
                : "No asset found."}
            </CommandEmpty>
            <CommandGroup>
              {displayAssets.map((asset) => (
                <CommandItem
                  className="flex gap-2"
                  key={asset.contractAddress}
                  value={asset.contractAddress}
                  onSelect={handleAssetSelect}
                >
                  <Avatar className="size-7 aspect-square">
                    <AvatarImage
                      src={asset.meta.imageUrl}
                      alt={asset.meta.displayName ?? asset.meta.symbol}
                    />
                    <AvatarFallback>
                      <Skeleton className="rounded-full" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-1 justify-between">
                      <span>{asset.meta.symbol}</span>
                      <span className="tabular-nums">
                        {asset?.balance
                          ? `${bigNumberToFloat(
                              asset.balance,
                              asset.meta.decimals,
                            )}`
                          : null}
                      </span>
                    </div>
                    <ExplorerAddressPreview
                      address={asset.contractAddress}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs opacity-50 hover:opacity-100"
                    >
                      {trimStringWithEllipsis(asset.contractAddress, 4, 6)}
                    </ExplorerAddressPreview>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
