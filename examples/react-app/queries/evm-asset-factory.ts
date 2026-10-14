import type { ChainAddress } from "@ston-fi/omniston-sdk-react";
import { queryOptions } from "@tanstack/react-query";
import { getBalance, multicall, type Config } from "@wagmi/core";
import { erc20Abi, type Address as ViemAddress } from "viem";
import { z } from "zod";

import { erc20AddressSchema } from "~/lib/evm/address";
import type { Asset } from "~/models/asset";
import type { EvmChain } from "~/models/chain-family";

export const evmAssetMockSchema = z.object({
  address: z.union([erc20AddressSchema, z.literal("native")]),
  metadata: z.object({
    decimals: z.coerce.number(),
    symbol: z.string(),
    displayName: z.string().optional(),
    imageUrl: z.url().optional(),
  }),
  balance: z.coerce.bigint().optional(),
});

export type EvmAssetMock = z.infer<typeof evmAssetMockSchema>;

type EvmAssetQueryArgs = {
  wagmiConfig: Config;
  walletAddress?: ChainAddress;
};

type CreateEvmAssetQueryFactoryParams = {
  chain: EvmChain;
  wagmiChainId: number;
  queryKey: string;
  searchQueryKey: string;
  getAssets: () => Promise<Asset[]>;
};

export function createEvmAssetQueryFactory({
  chain,
  wagmiChainId,
  queryKey,
  searchQueryKey,
  getAssets,
}: CreateEvmAssetQueryFactoryParams) {
  const fetchBalances = async (
    evmAssets: Asset[],
    wagmiConfig: Config,
    walletAddress: ViemAddress,
  ): Promise<Asset[]> => {
    const nativeAsset = evmAssets.find(
      (asset) =>
        asset.id.chain.$case === chain &&
        asset.id.chain.value.kind.$case === "native",
    );

    const erc20Addresses = evmAssets.reduce<ViemAddress[]>((acc, asset) => {
      if (
        asset.id.chain.$case === chain &&
        asset.id.chain.value.kind.$case === "erc20"
      ) {
        acc.push(asset.id.chain.value.kind.value as ViemAddress);
      }

      return acc;
    }, []);

    const [nativeBalance, erc20Balances] = await Promise.all([
      nativeAsset
        ? getBalance(wagmiConfig, {
            address: walletAddress,
            chainId: wagmiChainId,
          })
        : Promise.resolve(undefined),
      erc20Addresses.length
        ? multicall(wagmiConfig, {
            chainId: wagmiChainId,
            contracts: erc20Addresses.map((address) => ({
              abi: erc20Abi,
              address: address,
              functionName: "balanceOf",
              args: [walletAddress],
              account: walletAddress,
            })),
          })
        : Promise.resolve([]),
    ]);

    let erc20BalanceIndex = 0;

    return evmAssets.map((asset) => {
      if (
        asset.id.chain.$case === chain &&
        asset.id.chain.value.kind.$case === "native"
      ) {
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

  return {
    fetch: ({ wagmiConfig, walletAddress }: EvmAssetQueryArgs) => {
      return queryOptions({
        queryKey: ["assets", queryKey, walletAddress],
        queryFn: async () => {
          let assets = await getAssets();

          if (walletAddress?.chain.$case === chain) {
            assets = await fetchBalances(
              assets,
              wagmiConfig,
              walletAddress.chain.value as ViemAddress,
            );
          }

          return sortAssets(assets);
        },
      });
    },
    search: ({
      searchTerm,
      wagmiConfig,
      walletAddress,
    }: EvmAssetQueryArgs & {
      searchTerm: string;
    }) => {
      return queryOptions({
        queryKey: [searchQueryKey, searchTerm, walletAddress],
        queryFn: async () => {
          if (walletAddress?.chain.$case !== chain) return [];

          let assets = await getAssets();
          const term = searchTerm.toLowerCase();

          const filteredAssets = assets.filter((asset) =>
            asset.id.chain.$case === chain
              ? asset.metadata.symbol?.toLowerCase().includes(term) ||
                asset.metadata.displayName?.toLowerCase().includes(term)
              : false,
          );

          assets = await fetchBalances(
            filteredAssets,
            wagmiConfig,
            walletAddress.chain.value as ViemAddress,
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
