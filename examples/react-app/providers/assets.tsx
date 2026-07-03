"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsConnectionRestored } from "@tonconnect/ui-react";
import { createContext, useContext, useState } from "react";
import { useConfig as useWagmiConfig } from "wagmi";
import type { AssetId } from "@ston-fi/omniston-sdk-react";

import { Chain } from "@/models/chain";
import { serializeAssetId, isAssetIdEqual } from "@/models/asset-id";
import type { Asset } from "@/models/asset";
import { arbitrumAssetQueryFactory } from "@/queries/arbitrum-assets";
import { avalancheAssetQueryFactory } from "@/queries/avalanche-assets";
import { baseAssetQueryFactory } from "@/queries/base-assets";
import { bnbAssetQueryFactory } from "@/queries/bnb-assets";
import { ethereumAssetQueryFactory } from "@/queries/ethereum-assets";
import { polygonAssetQueryFactory } from "@/queries/polygon-assets";
import { tonAssetQueryFactory } from "@/queries/ton-assets";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";

type AssetsContextValue = {
  getAssetById: (assetId: AssetId) => Asset | undefined;
  insertAsset: (asset: Asset) => void;
  populateAssets: (assetIds: AssetId[]) => Promise<void>;
};

const AssetsContext = createContext<AssetsContextValue | undefined>(undefined);

export const AssetsProvider = ({ children }: React.PropsWithChildren) => {
  const queryClient = useQueryClient();

  const wagmiConfig = useWagmiConfig();
  const isTonConnectRestored = useIsConnectionRestored();
  const {
    arbitrum: arbitrumWalletAddress,
    avalanche: avalancheWalletAddress,
    base: baseWalletAddress,
    bnb: bnbWalletAddress,
    ethereum: ethereumWalletAddress,
    polygon: polygonWalletAddress,
    ton: tonWalletAddress,
  } = useConnectedWallets();

  // In-memory unconditional assets per blockchain — assets manually added by the user
  // that must survive query refetches. Session-only (not persisted).
  const [unconditionalArbitrumAssetIdList, setUnconditionalArbitrumAssetIdList] = useState<
    AssetId[]
  >([]);
  const [unconditionalAvalancheAssetIdList, setUnconditionalAvalancheAssetIdList] = useState<
    AssetId[]
  >([]);
  const [unconditionalTonAssetIdList, setUnconditionalTonAssetIdList] = useState<AssetId[]>([]);
  const [unconditionalBaseAssetIdList, setUnconditionalBaseAssetIdList] = useState<AssetId[]>([]);
  const [unconditionalPolygonAssetIdList, setUnconditionalPolygonAssetIdList] = useState<AssetId[]>(
    [],
  );
  const [unconditionalEthereumAssetIdList, setUnconditionalEthereumAssetIdList] = useState<
    AssetId[]
  >([]);
  const [unconditionalBnbAssetIdList, setUnconditionalBnbAssetIdList] = useState<AssetId[]>([]);

  const isWalletConnected =
    !!arbitrumWalletAddress ||
    !!avalancheWalletAddress ||
    !!baseWalletAddress ||
    !!bnbWalletAddress ||
    !!ethereumWalletAddress ||
    !!polygonWalletAddress ||
    !!tonWalletAddress;

  const refetchInterval = isWalletConnected ? 1000 * 60 : 1000 * 60 * 5;

  const arbitrumAssetsQuery = useQuery({
    ...arbitrumAssetQueryFactory.fetch({
      wagmiConfig,
      walletAddress: arbitrumWalletAddress,
    }),
    select: (data) => new Map(data.map((asset) => [serializeAssetId(asset.id), asset])),
    refetchInterval,
    staleTime: Infinity,
  });

  const avalancheAssetsQuery = useQuery({
    ...avalancheAssetQueryFactory.fetch({
      wagmiConfig,
      walletAddress: avalancheWalletAddress,
    }),
    select: (data) => new Map(data.map((asset) => [serializeAssetId(asset.id), asset])),
    refetchInterval,
    staleTime: Infinity,
  });

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

  const ethereumAssetsQuery = useQuery({
    ...ethereumAssetQueryFactory.fetch({
      wagmiConfig,
      walletAddress: ethereumWalletAddress,
    }),
    select: (data) => new Map(data.map((asset) => [serializeAssetId(asset.id), asset])),
    refetchInterval,
    staleTime: Infinity,
  });

  const bnbAssetsQuery = useQuery({
    ...bnbAssetQueryFactory.fetch({
      wagmiConfig,
      walletAddress: bnbWalletAddress,
    }),
    select: (data) => new Map(data.map((asset) => [serializeAssetId(asset.id), asset])),
    refetchInterval,
    staleTime: Infinity,
  });

  const getAssetById = (assetId: AssetId): Asset | undefined => {
    const chainCase = assetId.chain.$case;

    switch (chainCase) {
      case Chain.ARBITRUM:
        return arbitrumAssetsQuery.data?.get(serializeAssetId(assetId));
      case Chain.AVALANCHE:
        return avalancheAssetsQuery.data?.get(serializeAssetId(assetId));
      case Chain.BASE:
        return baseAssetsQuery.data?.get(serializeAssetId(assetId));
      case Chain.BNB:
        return bnbAssetsQuery.data?.get(serializeAssetId(assetId));
      case Chain.ETHEREUM:
        return ethereumAssetsQuery.data?.get(serializeAssetId(assetId));
      case Chain.POLYGON:
        return polygonAssetsQuery.data?.get(serializeAssetId(assetId));
      case Chain.TON:
        return tonAssetsQuery.data?.get(serializeAssetId(assetId));
      default: {
        chainCase satisfies never;
        throw new Error(`Unexpected chain: ${chainCase}`);
      }
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
      case Chain.ARBITRUM: {
        const unconditionalAddresses = [...unconditionalArbitrumAssetIdList, asset.id];
        setUnconditionalArbitrumAssetIdList(unconditionalAddresses);

        queryClient.setQueryData(
          arbitrumAssetQueryFactory.fetch({
            wagmiConfig,
            walletAddress: arbitrumWalletAddress,
          }).queryKey,
          assetQueryUpdater,
        );
        break;
      }
      case Chain.AVALANCHE: {
        const unconditionalAddresses = [...unconditionalAvalancheAssetIdList, asset.id];
        setUnconditionalAvalancheAssetIdList(unconditionalAddresses);

        queryClient.setQueryData(
          avalancheAssetQueryFactory.fetch({
            wagmiConfig,
            walletAddress: avalancheWalletAddress,
          }).queryKey,
          assetQueryUpdater,
        );
        break;
      }
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
      case Chain.ETHEREUM: {
        const unconditionalAddresses = [...unconditionalEthereumAssetIdList, asset.id];
        setUnconditionalEthereumAssetIdList(unconditionalAddresses);

        queryClient.setQueryData(
          ethereumAssetQueryFactory.fetch({
            wagmiConfig,
            walletAddress: ethereumWalletAddress,
          }).queryKey,
          assetQueryUpdater,
        );
        break;
      }
      case Chain.BNB: {
        const unconditionalAddresses = [...unconditionalBnbAssetIdList, asset.id];
        setUnconditionalBnbAssetIdList(unconditionalAddresses);

        queryClient.setQueryData(
          bnbAssetQueryFactory.fetch({
            wagmiConfig,
            walletAddress: bnbWalletAddress,
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

  // TODO(refactor): the assets injection flow needed to be improved and support non-TON chains as well
  const populateAssets = async (assetIds: AssetId[]) => {
    const tonAssetIdsToPopulate: AssetId[] = [];

    assetIds.forEach((assetId) => {
      if (getAssetById(assetId)) return;

      const chainCase = assetId.chain.$case;

      switch (chainCase) {
        case Chain.TON: {
          tonAssetIdsToPopulate.push(assetId);
          break;
        }
        default: {
          throw new Error(`Unsupported chain for populateAssets call: ${chainCase}`);
        }
      }
    });

    if (tonAssetIdsToPopulate.length === 0) return;

    const nextUnconditionalTonAssetIdList = [...unconditionalTonAssetIdList];

    tonAssetIdsToPopulate.forEach((assetId) => {
      const exists = nextUnconditionalTonAssetIdList.some((existingAssetId) =>
        isAssetIdEqual(existingAssetId, assetId),
      );

      if (!exists) {
        nextUnconditionalTonAssetIdList.push(assetId);
      }
    });

    setUnconditionalTonAssetIdList(nextUnconditionalTonAssetIdList);

    await queryClient.fetchQuery(
      tonAssetQueryFactory.fetch({
        unconditionalAssets: nextUnconditionalTonAssetIdList,
        walletAddress: tonWalletAddress,
      }),
    );
  };

  return (
    <AssetsContext.Provider
      value={{
        getAssetById,
        insertAsset,
        populateAssets,
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
