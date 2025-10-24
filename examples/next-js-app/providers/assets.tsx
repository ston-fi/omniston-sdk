"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsConnectionRestored, useTonAddress } from "@tonconnect/ui-react";
import { createContext, useContext, useEffect, useState } from "react";
import { z } from "zod";

import type { AssetMetadata } from "@/models/asset";
import { assetQueryFactory } from "@/quries/assets";

const UNCONDITIONAL_ASSETS_STORAGE_KEY = "unconditional_assets";

type AssetsContextValue = {
  assetsQuery: ReturnType<
    typeof useQuery<Map<AssetMetadata["contractAddress"], AssetMetadata>>
  >;
  getAssetByAddress: (
    address: AssetMetadata["contractAddress"],
  ) => AssetMetadata | undefined;
  insertAsset: (asset: AssetMetadata) => void;
};

const AssetsContext = createContext<AssetsContextValue | undefined>(undefined);

export const AssetsProvider = ({ children }: { children: React.ReactNode }) => {
  const walletAddress = useTonAddress();
  const isConnectionRestored = useIsConnectionRestored();
  const queryClient = useQueryClient();

  const [unconditionalAssets, setUnconditionalAssets] = useState(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const persistedUnconditionalAssets = localStorage.getItem(
      UNCONDITIONAL_ASSETS_STORAGE_KEY,
    );

    if (!persistedUnconditionalAssets) {
      return [];
    }

    return z
      .array(z.string())
      .catch([])
      .parse(JSON.parse(persistedUnconditionalAssets));
  });

  useEffect(() => {
    localStorage.setItem(
      UNCONDITIONAL_ASSETS_STORAGE_KEY,
      JSON.stringify(unconditionalAssets),
    );
  }, [unconditionalAssets]);

  const assetsQuery = useQuery({
    ...assetQueryFactory.fetch({
      unconditionalAssets,
      walletAddress,
    }),
    select: (data) =>
      new Map(data.map((asset) => [asset.contractAddress, asset])),
    enabled: isConnectionRestored,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    staleTime: Infinity, // Consider assets metadata as static data
  });

  const getAssetByAddress = (address: AssetMetadata["contractAddress"]) =>
    assetsQuery.data?.get(address);

  const insertAsset = (asset: AssetMetadata) => {
    if (getAssetByAddress(asset.contractAddress)) return;

    setUnconditionalAssets((prev) => [...prev, asset.contractAddress]);
    queryClient.setQueryData(
      assetQueryFactory.fetch({
        unconditionalAssets,
        walletAddress,
      }).queryKey,
      (old: AssetMetadata[] | undefined) => {
        if (!old) return [asset];

        const exists = old.some(
          (a) => a.contractAddress === asset.contractAddress,
        );

        if (exists) return old;

        return [...old, asset];
      },
    );
  };

  return (
    <AssetsContext.Provider
      value={{
        assetsQuery,
        getAssetByAddress,
        insertAsset,
      }}
    >
      {children}
    </AssetsContext.Provider>
  );
};

export const useAssets = () => {
  const context = useContext(AssetsContext);

  if (!context) {
    throw new Error("useAssets must be used within an AssetsProvider");
  }

  return context;
};
