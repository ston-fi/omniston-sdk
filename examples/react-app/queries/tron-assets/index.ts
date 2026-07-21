import type { ChainAddress } from "@ston-fi/omniston-sdk-react";
import { queryOptions } from "@tanstack/react-query";
import type { TronWeb } from "tronweb";

import type { TronAddress } from "~/lib/tron/address";
import { memoizePromise } from "~/lib/utils/promise";
import type { Asset } from "~/models/asset";
import { Chain } from "~/models/chain";
import { resolveAssetsMock } from "~/queries/assets-mock";

import { transformToAsset, tronAssetMockSchema } from "./tron-asset.schema";
import TRON_ASSETS_MOCK from "./tron-assets-mock.json";

const TRON_ASSETS_QUERY_KEY = "tron-assets";
const TRON_ASSETS_SEARCH_QUERY_KEY = "tron-assets-search";

export const tronAssetQueryFactory = createTronAssetQueryFactory({
  queryKey: TRON_ASSETS_QUERY_KEY,
  searchQueryKey: TRON_ASSETS_SEARCH_QUERY_KEY,
  getAssets: memoizePromise(async () =>
    (await resolveAssetsMock(Chain.TRON, TRON_ASSETS_MOCK, tronAssetMockSchema)).map(
      transformToAsset,
    ),
  ),
});

export function createTronAssetQueryFactory({
  queryKey,
  searchQueryKey,
  getAssets,
}: {
  queryKey: string;
  searchQueryKey: string;
  getAssets: () => Promise<Asset[]>;
}) {
  const fetchBalances = async (
    tronAssets: Asset[],
    walletAddress: TronAddress,
    tronWeb: TronWeb,
  ): Promise<Asset[]> => {
    const trc20ContractAddresses = tronAssets
      .map((asset) =>
        asset.id.chain.$case === Chain.TRON && asset.id.chain.value.kind.$case === "trc20"
          ? asset.id.chain.value.kind.value
          : null,
      )
      .filter(Boolean);
    const nativeAsset = tronAssets.find(
      (asset) =>
        asset.id.chain.$case === Chain.TRON && asset.id.chain.value.kind.$case === "native",
    );

    tronWeb.setAddress(walletAddress);

    const accountHex = tronWeb.address.toHex(walletAddress);
    const trc20Balances = trc20ContractAddresses.length
      ? await Promise.all(
          trc20ContractAddresses.map(async (address) => {
            try {
              const contract = await tronWeb.contract().at(address);
              const balance = await contract.balanceOf(accountHex).call();

              return BigInt(balance.toString());
            } catch {
              return 0n;
            }
          }),
        )
      : [];
    const nativeBalance = nativeAsset
      ? BigInt(await tronWeb.trx.getBalance(walletAddress))
      : undefined;

    let trc20BalanceIndex = 0;

    return tronAssets.map((asset) => {
      if (asset.id.chain.$case === Chain.TRON && asset.id.chain.value.kind.$case === "native") {
        return {
          ...asset,
          balance: nativeBalance,
        };
      }

      const balance = trc20Balances[trc20BalanceIndex++];

      return {
        ...asset,
        balance: balance ? balance : undefined,
      };
    });
  };

  return {
    fetch: ({
      getTronWebClient,
      walletAddress,
    }: {
      getTronWebClient: () => TronWeb;
      walletAddress?: ChainAddress;
    }) => {
      return queryOptions({
        queryKey: ["assets", queryKey, walletAddress],
        queryFn: async () => {
          let assets = await getAssets();

          if (walletAddress?.chain.$case === Chain.TRON) {
            assets = await fetchBalances(
              assets,
              walletAddress.chain.value as TronAddress,
              getTronWebClient(),
            );
          }

          return sortAssets(assets);
        },
      });
    },
    search: ({
      searchTerm,
      getTronWebClient,
      walletAddress,
    }: {
      getTronWebClient: () => TronWeb;
      searchTerm: string;
      walletAddress?: ChainAddress;
    }) => {
      return queryOptions({
        queryKey: [searchQueryKey, searchTerm, walletAddress],
        queryFn: async () => {
          if (walletAddress?.chain.$case !== Chain.TRON) return [];

          let assets = await getAssets();
          const term = searchTerm.toLowerCase();

          const filteredAssets = assets.filter((asset) =>
            asset.id.chain.$case === Chain.TRON && asset.id.chain.value.kind.$case === "trc20"
              ? asset.id.chain.value.kind.value === term
              : asset.metadata.symbol?.toLowerCase().includes(term) ||
                asset.metadata.displayName?.toLowerCase().includes(term),
          );

          assets = await fetchBalances(
            filteredAssets,
            walletAddress.chain.value as TronAddress,
            getTronWebClient(),
          );

          return sortAssets(assets);
        },
      });
    },
  };
}

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
