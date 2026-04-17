"use client";

import { useQuery, useQueries, type UseQueryOptions } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { bigNumberToFloat, cn } from "@/lib/utils";
import type { Asset } from "@/models/asset";
import { isAssetIdEqual, deserializeAssetId, serializeAssetId } from "@/models/asset-id";
import { truncateAddress, addressFromAssetId } from "@/models/address";

import { ExplorerAddressPreview } from "./ExplorerAddressPreview";
import { CHAIN_METADATA, Chain, chainSchema } from "@/models/chain";
import { useAssets } from "@/providers/assets";

type AssetQueryOptions = UseQueryOptions<Asset[], Error, Asset[], any[]>;

export type ChainTabConfig = {
  chain: Chain;
  fetchQueryOptions: AssetQueryOptions;
  searchQueryOptions?: (searchTerm: string) => AssetQueryOptions;
};

type AssetSelectProps = {
  chains: [ChainTabConfig, ...ChainTabConfig[]];
  selectedAsset: Asset | null;
  excludeAsset?: Asset | null;
  onAssetSelect?: (id: Asset["id"] | null) => void;
  className?: string;
};

export const AssetSelect = ({
  chains,
  selectedAsset,
  excludeAsset,
  onAssetSelect,
  className,
}: AssetSelectProps) => {
  const { insertAsset } = useAssets();

  const defaultChain = chains[0];

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && window.matchMedia("(pointer: fine)").matches) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [open]);
  const [selectedChain, setSelectedChain] = useState<Chain>(() => {
    const parsedChain = chainSchema.safeParse(selectedAsset?.id.chain.$case);

    if (parsedChain.success) {
      return parsedChain.data;
    }

    return defaultChain.chain;
  });

  // Sync active tab with selection
  useEffect(() => {
    if (selectedAsset) {
      setSelectedChain(selectedAsset.id.chain.$case);
    }
  }, [selectedAsset]);

  // Pre-fetch all chains so data is ready when switching tabs
  useQueries({
    queries: chains.map((chain) => chain.fetchQueryOptions),
  });

  const activeConfig = chains.find(({ chain }) => chain === selectedChain) ?? defaultChain;

  const fetchResult = useQuery(activeConfig.fetchQueryOptions);

  const searchResult = useQuery({
    ...(activeConfig.searchQueryOptions?.(searchTerm) ?? {
      queryKey: ["__noop__"],
      queryFn: () => [],
    }),
    enabled: searchTerm.length > 0 && !!activeConfig.searchQueryOptions,
  });

  const rawAssets: Asset[] =
    searchTerm.length > 0 ? (searchResult.data ?? []) : (fetchResult.data ?? []);

  const displayAssets = excludeAsset
    ? rawAssets.filter((a) => !isAssetIdEqual(a.id, excludeAsset.id))
    : rawAssets;

  const handleAssetSelect = (assetIdStr: string) => {
    const asset = displayAssets.find((asset) =>
      isAssetIdEqual(asset.id, deserializeAssetId(assetIdStr)),
    );

    if (asset) {
      insertAsset(asset);
      onAssetSelect?.(asset.id);
    }

    setOpen(false);
    setSearchTerm("");
  };

  useEffect(() => {
    if (!open) setSearchTerm("");
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <AssetSelectTrigger selectedAsset={selectedAsset} className={className} />
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[300px] p-0">
        <BlockchainTab
          className="border-b"
          chains={chains}
          selectedChain={selectedChain}
          onChainSelect={setSelectedChain}
        />

        <Command shouldFilter={false}>
          <CommandInput
            ref={searchInputRef}
            placeholder="Search asset…"
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {searchTerm.length > 0 && searchResult.isLoading && (
              <div className="p-2">
                <Skeleton className="h-4 w-full" />
              </div>
            )}
            {fetchResult.isLoading && searchTerm.length === 0 && (
              <div className="space-y-2 p-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            )}
            {searchResult.isFetched && fetchResult.isFetched ? (
              <CommandEmpty>
                {searchTerm.length > 0 && searchResult.isError
                  ? "Error searching assets."
                  : "No asset found."}
              </CommandEmpty>
            ) : null}
            <CommandGroup>
              {displayAssets.map((asset) => {
                const assetAddress = addressFromAssetId(asset.id);

                return (
                  <CommandItem
                    className="flex gap-2"
                    key={serializeAssetId(asset.id)}
                    value={serializeAssetId(asset.id)}
                    onSelect={handleAssetSelect}
                  >
                    <Avatar className="aspect-square size-7 shrink-0">
                      <AvatarImage
                        src={asset.metadata.imageUrl}
                        alt={asset.metadata.displayName ?? asset.metadata.symbol}
                      />
                      <AvatarFallback>
                        <Skeleton className="rounded-full" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between gap-1">
                        <span>{asset.metadata.symbol}</span>
                        <span className="text-muted-foreground text-sm tabular-nums">
                          {asset?.balance
                            ? bigNumberToFloat(asset.balance, asset.metadata.decimals)
                            : null}
                        </span>
                      </div>

                      {assetAddress ? (
                        <ExplorerAddressPreview
                          address={assetAddress}
                          onClick={(e) => e.stopPropagation()}
                          className="w-fit text-xs opacity-50 hover:opacity-100"
                        >
                          {truncateAddress(assetAddress)}
                        </ExplorerAddressPreview>
                      ) : null}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface AssetSelectTriggerProps extends Omit<React.ComponentProps<typeof Button>, "children"> {
  selectedAsset: Asset | null;
}

const AssetSelectTrigger = React.forwardRef<
  React.ComponentRef<typeof Button>,
  AssetSelectTriggerProps
>(function AssetSelectTrigger({ selectedAsset, className, ...props }, ref) {
  return (
    <Button
      ref={ref}
      {...props}
      variant="outline"
      role="combobox"
      className={cn("w-full justify-start group data-[state=open]:border-foreground/50", className)}
    >
      {selectedAsset ? (
        <>
          <Avatar className="mr-2 size-[20px] shrink-0">
            <AvatarImage
              src={selectedAsset.metadata.imageUrl}
              alt={selectedAsset.metadata.symbol}
            />
          </Avatar>
          <span className="truncate">{selectedAsset.metadata.symbol}</span>
        </>
      ) : (
        <span className="truncate">Select asset…</span>
      )}

      <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
    </Button>
  );
});

interface BlockchainTabProps extends Omit<React.ComponentProps<"div">, "children"> {
  selectedChain: Chain;
  chains: ChainTabConfig[];
  onChainSelect: (chain: Chain) => void;
}

function BlockchainTab({ chains, selectedChain, onChainSelect, ...props }: BlockchainTabProps) {
  return (
    <div className={cn("flex flex-1", props.className)}>
      {chains.map(({ chain }) => {
        const { label, imageUrl } = CHAIN_METADATA[chain];

        return (
          <button
            key={chain}
            type="button"
            onClick={() => onChainSelect(chain)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              selectedChain === chain
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Avatar className="size-4 shrink-0">
              <AvatarImage src={imageUrl} alt={label} />
            </Avatar>

            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
