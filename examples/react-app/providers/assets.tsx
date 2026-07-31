"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { tronAssetQueryFactory } from "~/queries/tron-assets";
import { useTronWebClient } from "~/hooks/useTronWebClient";

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
  [Chain.TRON]: tronAssetQueryFactory,
} satisfies Record<Chain, unknown>;

const ASSET_QUERY_CONNECTED_WALLET_REFETCH_INTERVAL_MS = 60 * 1000;
const ASSET_QUERY_DISCONNECTED_WALLET_REFETCH_INTERVAL_MS = 5 * 60 * 1000;

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
  const getTronWebClient = useTronWebClient();
  const { walletAddressByChain: connectedWalletAddressByChain, isWalletRestoredByChain } =
    useConnectedWallets();

  // In-memory unconditional assets per blockchain — assets manually added by the user
  // that must survive query refetches. Session-only (not persisted).
  const [unconditionalAssetsByChain, setUnconditionalAssetsByChain] = useState<
    Partial<Record<Chain, AssetId[]>>
  >({});

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
      walletAddress: connectedWalletAddressByChain[chain],
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
          walletAddress: connectedWalletAddressByChain[Chain.TON],
        });
      case Chain.TRON:
        return ASSET_QUERY_FACTORIES[Chain.TRON].fetch({
          getTronWebClient,
          walletAddress: connectedWalletAddressByChain[Chain.TRON],
        });
      default: {
        chain satisfies never;
        throw new Error(`Unexpected chain: ${chain}`);
      }
    }
  };

  const getCommonQueryOptions = (chain: Chain) => ({
    enabled: isWalletRestoredByChain[chain],
    placeholderData: (previousAssets?: Asset[]) =>
      previousAssets?.map((asset) => ({
        ...asset,
        balance: undefined,
      })),
    refetchInterval: connectedWalletAddressByChain[chain]
      ? ASSET_QUERY_CONNECTED_WALLET_REFETCH_INTERVAL_MS
      : ASSET_QUERY_DISCONNECTED_WALLET_REFETCH_INTERVAL_MS,
    select: (assets: Asset[]) =>
      new Map(assets.map((asset) => [serializeAssetId(asset.id), asset])),
    staleTime: Infinity,
  });

  const arbitrumAssetsQuery = useQuery({
    ...getEvmAssetFetchOptions(Chain.ARBITRUM),
    ...getCommonQueryOptions(Chain.ARBITRUM),
  });

  const avalancheAssetsQuery = useQuery({
    ...getEvmAssetFetchOptions(Chain.AVALANCHE),
    ...getCommonQueryOptions(Chain.AVALANCHE),
  });

  const baseAssetsQuery = useQuery({
    ...getEvmAssetFetchOptions(Chain.BASE),
    ...getCommonQueryOptions(Chain.BASE),
  });

  const bnbAssetsQuery = useQuery({
    ...getEvmAssetFetchOptions(Chain.BNB),
    ...getCommonQueryOptions(Chain.BNB),
  });

  const ethereumAssetsQuery = useQuery({
    ...getEvmAssetFetchOptions(Chain.ETHEREUM),
    ...getCommonQueryOptions(Chain.ETHEREUM),
  });

  const polygonAssetsQuery = useQuery({
    ...getEvmAssetFetchOptions(Chain.POLYGON),
    ...getCommonQueryOptions(Chain.POLYGON),
  });

  const robinhoodAssetQuery = useQuery({
    ...getEvmAssetFetchOptions(Chain.ROBINHOOD),
    ...getCommonQueryOptions(Chain.ROBINHOOD),
  });

  const tonAssetsQuery = useQuery({
    ...ASSET_QUERY_FACTORIES[Chain.TON].fetch({
      unconditionalAssets: getUnconditionalAssets(Chain.TON),
      walletAddress: connectedWalletAddressByChain[Chain.TON],
    }),
    ...getCommonQueryOptions(Chain.TON),
  });

  const tronAssetsQuery = useQuery({
    ...ASSET_QUERY_FACTORIES[Chain.TRON].fetch({
      getTronWebClient,
      walletAddress: connectedWalletAddressByChain[Chain.TRON],
    }),
    ...getCommonQueryOptions(Chain.TRON),
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
    [Chain.TRON]: tronAssetsQuery,
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
    const [tonAssetIds, unsupportedAssetIds] = assetIds.reduce<[AssetId[], AssetId[]]>(
      (acc, assetId) => {
        if (assetId.chain.$case === Chain.TON) {
          if (!getAssetById(assetId)) {
            acc[0].push(assetId);
          }
        } else {
          acc[1].push(assetId);
        }

        return acc;
      },
      [[], []],
    );

    if (unsupportedAssetIds.length > 0) {
      console.warn(
        "populateAssets currently only supports TON assets. Non-TON assets were ignored:",
        unsupportedAssetIds.map(serializeAssetId),
      );
    }

    if (tonAssetIds.length === 0) return;

    const nextUnconditionalAssets = appendMissingAssetIds(
      getUnconditionalAssets(Chain.TON),
      tonAssetIds,
    );

    setUnconditionalAssets(Chain.TON, nextUnconditionalAssets);

    await queryClient.fetchQuery(
      ASSET_QUERY_FACTORIES[Chain.TON].fetch({
        unconditionalAssets: nextUnconditionalAssets,
        walletAddress: connectedWalletAddressByChain[Chain.TON],
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
