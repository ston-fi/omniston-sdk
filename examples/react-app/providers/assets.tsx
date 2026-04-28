"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsConnectionRestored } from "@tonconnect/ui-react";
import { createContext, useCallback, useContext, useState } from "react";
import { useConfig as useWagmiConfig } from "wagmi";
import type { AssetId } from "@ston-fi/omniston-sdk-react";

import { Chain } from "@/models/chain";
import { serializeAssetId, isAssetIdEqual } from "@/models/asset-id";
import type { Asset } from "@/models/asset";
import { tonAssetQueryFactory } from "@/queries/ton-assets";
import { baseAssetQueryFactory } from "@/queries/base-assets";
import { polygonAssetQueryFactory } from "@/queries/polygon-assets";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";

type AssetsContextValue = {
  getNativeAsset: (chainId: AssetId["chain"]["$case"]) => Asset | undefined;
  getAssetById: (assetId: AssetId) => Asset | undefined;
  insertAsset: (asset: Asset) => void;
};

const AssetsContext = createContext<AssetsContextValue | undefined>(undefined);

export const AssetsProvider = ({ children }: React.PropsWithChildren) => {
  const queryClient = useQueryClient();

  const wagmiConfig = useWagmiConfig();
  const isTonConnectRestored = useIsConnectionRestored();
  const {
    ton: tonWalletAddress,
    base: baseWalletAddress,
    polygon: polygonWalletAddress,
  } = useConnectedWallets();

  // In-memory unconditional assets per blockchain — assets manually added by the user
  // that must survive query refetches. Session-only (not persisted).
  const [unconditionalTonAssetIdList, setUnconditionalTonAssetIdList] = useState<AssetId[]>([]);
  const [unconditionalBaseAssetIdList, setUnconditionalBaseAssetIdList] = useState<AssetId[]>([]);
  const [unconditionalPolygonAssetIdList, setUnconditionalPolygonAssetIdList] = useState<AssetId[]>(
    [],
  );

  const isWalletConnected = !!tonWalletAddress || !!baseWalletAddress || !!polygonWalletAddress;
  const refetchInterval = isWalletConnected ? 1000 * 60 : 1000 * 60 * 5;

  const tonAssetsQuery = useQuery({
    ...tonAssetQueryFactory.fetch({
      unconditionalAssets: unconditionalTonAssetIdList,
      walletAddress: tonWalletAddress,
    }),
    select: (data) => new Map(data.map((asset) => [serializeAssetId(asset.id), asset])),
    enabled: isTonConnectRestored,
    refetchInterval,
    staleTime: Infinity,
  });

  const baseAssetsQuery = useQuery({
    ...baseAssetQueryFactory.fetch({
      wagmiConfig,
      walletAddress: baseWalletAddress,
    }),
    select: (data) => new Map(data.map((asset) => [serializeAssetId(asset.id), asset])),
    refetchInterval,
    staleTime: Infinity,
  });

  const polygonAssetsQuery = useQuery({
    ...polygonAssetQueryFactory.fetch({
      wagmiConfig,
      walletAddress: polygonWalletAddress,
    }),
    select: (data) => new Map(data.map((asset) => [serializeAssetId(asset.id), asset])),
    refetchInterval,
    staleTime: Infinity,
  });

  const getAssetById = (assetId: AssetId): Asset | undefined => {
    const chainCase = assetId.chain.$case;

    switch (chainCase) {
      case Chain.TON:
        return tonAssetsQuery.data?.get(serializeAssetId(assetId));
      case Chain.BASE:
        return baseAssetsQuery.data?.get(serializeAssetId(assetId));
      case Chain.POLYGON:
        return polygonAssetsQuery.data?.get(serializeAssetId(assetId));
      default:
        return undefined;
    }
  };

  const insertAsset = (asset: Asset) => {
    if (getAssetById(asset.id)) return;

    const assetQueryUpdater = (old: Asset[] | undefined) => {
      if (!old) return [asset];
      const exists = old.some((a) => isAssetIdEqual(a.id, asset.id));
      if (exists) return old;
      return [...old, asset];
    };

    const chainCase = asset.id.chain.$case;

    switch (chainCase) {
      case Chain.TON: {
        const unconditionalAddresses = [...unconditionalTonAssetIdList, asset.id];
        setUnconditionalTonAssetIdList(unconditionalAddresses);

        queryClient.setQueryData(
          tonAssetQueryFactory.fetch({
            unconditionalAssets: unconditionalAddresses,
            walletAddress: tonWalletAddress,
          }).queryKey,
          assetQueryUpdater,
        );
        break;
      }
      case Chain.BASE: {
        const unconditionalAddresses = [...unconditionalBaseAssetIdList, asset.id];
        setUnconditionalBaseAssetIdList(unconditionalAddresses);

        queryClient.setQueryData(
          baseAssetQueryFactory.fetch({
            wagmiConfig,
            walletAddress: baseWalletAddress,
          }).queryKey,
          assetQueryUpdater,
        );
        break;
      }
      case Chain.POLYGON: {
        const unconditionalAddresses = [...unconditionalPolygonAssetIdList, asset.id];
        setUnconditionalPolygonAssetIdList(unconditionalAddresses);

        queryClient.setQueryData(
          polygonAssetQueryFactory.fetch({
            wagmiConfig,
            walletAddress: polygonWalletAddress,
          }).queryKey,
          assetQueryUpdater,
        );
        break;
      }
      default: {
        chainCase satisfies never;
        throw new Error(`Unexpected chain: ${chainCase}`);
      }
    }
  };

  const getNativeAsset = useCallback(
    (chainId: AssetId["chain"]["$case"]): Asset | undefined => {
      switch (chainId) {
        case Chain.TON:
          return tonAssetsQuery.data?.get(
            serializeAssetId({
              chain: {
                $case: chainId,
                value: { kind: { $case: "native", value: {} } },
              },
            }),
          );
        case Chain.BASE:
          return baseAssetsQuery.data?.get(
            serializeAssetId({
              chain: {
                $case: chainId,
                value: { kind: { $case: "native", value: {} } },
              },
            }),
          );
        case Chain.POLYGON:
          return polygonAssetsQuery.data?.get(
            serializeAssetId({
              chain: {
                $case: chainId,
                value: { kind: { $case: "native", value: {} } },
              },
            }),
          );
        default:
          return undefined;
      }
    },
    [tonAssetsQuery.data, baseAssetsQuery.data, polygonAssetsQuery.data],
  );

  return (
    <AssetsContext.Provider
      value={{
        getNativeAsset,
        getAssetById,
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
