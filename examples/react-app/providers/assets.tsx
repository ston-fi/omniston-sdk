"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsConnectionRestored } from "@tonconnect/ui-react";
import { createContext, useContext, useState } from "react";
import { useConfig as useWagmiConfig } from "wagmi";
import type { AssetId } from "@ston-fi/omniston-sdk-react";

import { Chain } from "~/models/chain";
import { ChainFamily, isChainInFamily, type EvmChain } from "~/models/chain-family";
import { serializeAssetId, isAssetIdEqual } from "~/models/asset-id";
import type { Asset } from "~/models/asset";
import { arbitrumAssetQueryFactory } from "~/queries/arbitrum-assets";
import { avalancheAssetQueryFactory } from "~/queries/avalanche-assets";
import { baseAssetQueryFactory } from "~/queries/base-assets";
import { bnbAssetQueryFactory } from "~/queries/bnb-assets";
import { ethereumAssetQueryFactory } from "~/queries/ethereum-assets";
import { polygonAssetQueryFactory } from "~/queries/polygon-assets";
import { robinhoodAssetQueryFactory } from "~/queries/robinhood-assets";
import { tonAssetQueryFactory } from "~/queries/ton-assets";
import { useConnectedWallets } from "~/hooks/useConnectedWallets";

type AssetsContextValue = {
  getAssetById: (assetId: AssetId) => Asset | undefined;
  getAssetsByChain: (chain: Chain) => Asset[];
  insertAsset: (asset: Asset) => void;
  populateAssets: (assetIds: AssetId[]) => Promise<void>;
};

const ASSET_QUERY_FACTORIES = {
  [Chain.ARBITRUM]: arbitrumAssetQueryFactory,
  [Chain.AVALANCHE]: avalancheAssetQueryFactory,
  [Chain.BASE]: baseAssetQueryFactory,
  [Chain.BNB]: bnbAssetQueryFactory,
  [Chain.ETHEREUM]: ethereumAssetQueryFactory,
  [Chain.POLYGON]: polygonAssetQueryFactory,
  [Chain.ROBINHOOD]: robinhoodAssetQueryFactory,
  [Chain.TON]: tonAssetQueryFactory,
} satisfies Record<Chain, unknown>;

const AssetsContext = createContext<AssetsContextValue | undefined>(undefined);

const appendMissingAssetIds = (assetIds: AssetId[], assetIdsToAppend: AssetId[]) => {
  const nextAssetIds = [...assetIds];

  assetIdsToAppend.forEach((assetId) => {
    const exists = nextAssetIds.some((existingAssetId) => isAssetIdEqual(existingAssetId, assetId));

    if (!exists) {
      nextAssetIds.push(assetId);
    }
  });

  return nextAssetIds;
};

export const AssetsProvider = ({ children }: React.PropsWithChildren) => {
  const queryClient = useQueryClient();

  const wagmiConfig = useWagmiConfig();
  const isTonConnectRestored = useIsConnectionRestored();
  const walletAddresses = useConnectedWallets();

  // In-memory unconditional assets per blockchain — assets manually added by the user
  // that must survive query refetches. Session-only (not persisted).
  const [unconditionalAssetsByChain, setUnconditionalAssetsByChain] = useState<
    Partial<Record<Chain, AssetId[]>>
  >({});

  const isWalletConnected = Object.values(walletAddresses).some(Boolean);
  const refetchInterval = isWalletConnected ? 1000 * 60 : 1000 * 60 * 5;

  const getUnconditionalAssets = (chain: Chain) => unconditionalAssetsByChain[chain] ?? [];

  const setUnconditionalAssets = (chain: Chain, assetIds: AssetId[]) => {
    setUnconditionalAssetsByChain((prev) => ({
      ...prev,
      [chain]: assetIds,
    }));
  };

  const getEvmAssetFetchOptions = (chain: EvmChain) =>
    ASSET_QUERY_FACTORIES[chain].fetch({
      wagmiConfig,
      walletAddress: walletAddresses[chain],
    });

  const getAssetFetchOptions = (
    chain: Chain,
    unconditionalAssets = getUnconditionalAssets(chain),
  ) => {
    if (isChainInFamily(chain, ChainFamily.EVM)) {
      return getEvmAssetFetchOptions(chain);
    }

    switch (chain) {
      case Chain.TON:
        return ASSET_QUERY_FACTORIES[Chain.TON].fetch({
          unconditionalAssets,
          walletAddress: walletAddresses[Chain.TON],
        });
      default: {
        chain satisfies never;
        throw new Error(`Unexpected chain: ${chain}`);
      }
    }
  };

  const commonQueryOptions = {
    select: (assets: Asset[]) =>
      new Map(assets.map((asset) => [serializeAssetId(asset.id), asset])),
    refetchInterval,
    staleTime: Infinity,
  };

  const arbitrumAssetsQuery = useQuery({
    ...getEvmAssetFetchOptions(Chain.ARBITRUM),
    ...commonQueryOptions,
  });

  const avalancheAssetsQuery = useQuery({
    ...getEvmAssetFetchOptions(Chain.AVALANCHE),
    ...commonQueryOptions,
  });

  const baseAssetsQuery = useQuery({
    ...getEvmAssetFetchOptions(Chain.BASE),
    ...commonQueryOptions,
  });

  const bnbAssetsQuery = useQuery({
    ...getEvmAssetFetchOptions(Chain.BNB),
    ...commonQueryOptions,
  });

  const ethereumAssetsQuery = useQuery({
    ...getEvmAssetFetchOptions(Chain.ETHEREUM),
    ...commonQueryOptions,
  });

  const polygonAssetsQuery = useQuery({
    ...getEvmAssetFetchOptions(Chain.POLYGON),
    ...commonQueryOptions,
  });

  const robinhoodAssetQuery = useQuery({
    ...getEvmAssetFetchOptions(Chain.ROBINHOOD),
    ...commonQueryOptions,
  });

  const tonAssetsQuery = useQuery({
    ...ASSET_QUERY_FACTORIES[Chain.TON].fetch({
      unconditionalAssets: getUnconditionalAssets(Chain.TON),
      walletAddress: walletAddresses[Chain.TON],
    }),
    ...commonQueryOptions,
    enabled: isTonConnectRestored,
  });

  const assetsQueries = {
    [Chain.ARBITRUM]: arbitrumAssetsQuery,
    [Chain.AVALANCHE]: avalancheAssetsQuery,
    [Chain.BASE]: baseAssetsQuery,
    [Chain.BNB]: bnbAssetsQuery,
    [Chain.ETHEREUM]: ethereumAssetsQuery,
    [Chain.POLYGON]: polygonAssetsQuery,
    [Chain.ROBINHOOD]: robinhoodAssetQuery,
    [Chain.TON]: tonAssetsQuery,
  } satisfies Record<Chain, unknown>;

  const getAssetById = (assetId: AssetId): Asset | undefined => {
    return assetsQueries[assetId.chain.$case].data?.get(serializeAssetId(assetId));
  };

  const getAssetsByChain = (chain: Chain): Asset[] => {
    return Array.from(assetsQueries[chain].data?.values() ?? []);
  };

  const insertAsset = (asset: Asset) => {
    if (getAssetById(asset.id)) return;

    const chain = asset.id.chain.$case;
    const nextUnconditionalAssets = appendMissingAssetIds(getUnconditionalAssets(chain), [
      asset.id,
    ]);

    setUnconditionalAssets(chain, nextUnconditionalAssets);

    queryClient.setQueryData(
      getAssetFetchOptions(chain, nextUnconditionalAssets).queryKey,
      (old: Asset[] | undefined) => {
        if (!old) return [asset];

        const exists = old.some((existingAsset) => isAssetIdEqual(existingAsset.id, asset.id));
        if (exists) return old;

        return [...old, asset];
      },
    );
  };

  const populateAssets = async (assetIds: AssetId[]) => {
    if (assetIds.some((assetId) => assetId.chain.$case !== Chain.TON)) {
      throw new Error("populateAssets only supports TON assets");
    }

    const tonAssetIdsToPopulate = assetIds.filter((assetId) => {
      if (getAssetById(assetId)) return false;
      if (assetId.chain.$case !== Chain.TON) return false;

      return true;
    });

    if (tonAssetIdsToPopulate.length === 0) return;

    const nextUnconditionalAssets = appendMissingAssetIds(
      getUnconditionalAssets(Chain.TON),
      tonAssetIdsToPopulate,
    );

    setUnconditionalAssets(Chain.TON, nextUnconditionalAssets);

    await queryClient.fetchQuery(
      ASSET_QUERY_FACTORIES[Chain.TON].fetch({
        unconditionalAssets: nextUnconditionalAssets,
        walletAddress: walletAddresses[Chain.TON],
      }),
    );
  };

  return (
    <AssetsContext.Provider
      value={{
        getAssetById,
        getAssetsByChain,
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
