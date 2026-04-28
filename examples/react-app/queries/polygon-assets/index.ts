import { queryOptions } from "@tanstack/react-query";
import { polygon } from "@reown/appkit/networks";
import { getBalance, multicall, type Config } from "@wagmi/core";
import type { ChainAddress } from "@ston-fi/omniston-sdk-react";
import { erc20Abi, type Address } from "viem";

import type { Asset } from "@/models/asset";
import { Chain } from "@/models/chain";

import POLYGON_ASSETS_MOCK from "./polygon-assets-mock.json";
import { polygonAssetSchema, transformToAsset } from "./polygon-asset-schema";

const POLYGON_ASSETS_QUERY_KEY = "polygon-assets";
const POLYGON_ASSETS_SEARCH_QUERY_KEY = "polygon-assets-search";

export const polygonAssetQueryFactory = {
  fetch: ({
    wagmiConfig,
    walletAddress,
  }: {
    wagmiConfig: Config;
    walletAddress?: ChainAddress;
  }) => {
    return queryOptions({
      queryKey: ["assets", POLYGON_ASSETS_QUERY_KEY, walletAddress],
      queryFn: async () => {
        let assets = polygonAssetSchema.array().parse(POLYGON_ASSETS_MOCK).map(transformToAsset);

        if (walletAddress?.chain.$case === Chain.POLYGON) {
          assets = await fetchBalances(assets, wagmiConfig, walletAddress.chain.value as Address);
        }

        return sortAssets(assets);
      },
    });
  },
  search: ({
    searchTerm,
    wagmiConfig,
    walletAddress,
  }: {
    searchTerm: string;
    wagmiConfig: Config;
    walletAddress?: ChainAddress;
  }) => {
    return queryOptions({
      queryKey: [POLYGON_ASSETS_SEARCH_QUERY_KEY, searchTerm, walletAddress],
      queryFn: async () => {
        if (walletAddress?.chain.$case !== Chain.POLYGON) return [];

        let assets = polygonAssetSchema.array().parse(POLYGON_ASSETS_MOCK).map(transformToAsset);
        const term = searchTerm.toLowerCase();

        const filteredAssets = assets.filter((a) =>
          a.id.chain.$case === Chain.POLYGON && a.id.chain.value.kind.$case === "erc20"
            ? a.id.chain.value.kind.value === term
            : a.metadata.symbol?.toLowerCase().includes(term) ||
              a.metadata.displayName?.toLowerCase().includes(term),
        );

        assets = await fetchBalances(
          filteredAssets,
          wagmiConfig,
          walletAddress.chain.value as Address,
        );

        return sortAssets(assets);
      },
    });
  },
};

function sortAssets(assets: Asset[]) {
  return assets.sort((a, b) => {
    const aBalance = a.balance ?? 0n;
    const bBalance = b.balance ?? 0n;

    if (aBalance > 0n && !(bBalance > 0n)) return -1;
    if (bBalance > 0n && !(aBalance > 0n)) return 1;

    const aAmountUSD = a.priceUsd ? a.priceUsd * Number(aBalance) : undefined;
    const bAmountUSD = b.priceUsd ? b.priceUsd * Number(bBalance) : undefined;

    if (aAmountUSD && !bAmountUSD) return -1;
    if (!aAmountUSD && bAmountUSD) return 1;

    if (aAmountUSD && bAmountUSD) {
      return bAmountUSD - aAmountUSD;
    }

    if (aBalance > bBalance) return -1;
    if (aBalance < bBalance) return 1;

    if (a.metadata.symbol && b.metadata.symbol) {
      return a.metadata.symbol.localeCompare(b.metadata.symbol);
    }

    return 0;
  });
}

const fetchBalances = async (
  polygonAssets: Asset[],
  wagmiConfig: Config,
  walletAddress: Address,
): Promise<Asset[]> => {
  const erc20Assets = polygonAssets.filter(
    (asset) =>
      asset.id.chain.$case === Chain.POLYGON && asset.id.chain.value.kind.$case === "erc20",
  );
  const nativeAsset = polygonAssets.find(
    (asset) =>
      asset.id.chain.$case === Chain.POLYGON && asset.id.chain.value.kind.$case === "native",
  );

  const [erc20Balances, nativeBalance] = await Promise.all([
    erc20Assets.length
      ? multicall(wagmiConfig, {
          chainId: polygon.id,
          contracts: erc20Assets.map((erc20Asset) => ({
            abi: erc20Abi,
            address: erc20Asset.id.chain.value.kind.value as Address,
            functionName: "balanceOf",
            args: [walletAddress],
            account: walletAddress,
          })),
        })
      : Promise.resolve([]),
    nativeAsset
      ? getBalance(wagmiConfig, {
          address: walletAddress,
          chainId: polygon.id,
        })
      : Promise.resolve(undefined),
  ]);

  let erc20BalanceIndex = 0;

  return polygonAssets.map((asset) => {
    if (asset.id.chain.$case === Chain.POLYGON && asset.id.chain.value.kind.$case === "native") {
      return {
        ...asset,
        balance: nativeBalance?.value,
      };
    }

    const balance = erc20Balances[erc20BalanceIndex++];

    return {
      ...asset,
      balance: balance?.result ? BigInt(balance.result) : undefined,
    };
  });
};
