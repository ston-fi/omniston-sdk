"use client";

import { useConfig as useWagmiConfig } from "wagmi";

import { AssetSelect, type ChainTabConfig } from "~/components/AssetSelect";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useConnectedWallets } from "~/hooks/useConnectedWallets";
import { useTronWebClient } from "~/hooks/useTronWebClient";
import { cn } from "~/lib/utils";
import { Chain } from "~/models/chain";
import { ChainFamily, chainsByFamily } from "~/models/chain-family";
import { useAssets } from "~/providers/assets";
import { useSwapForm, useSwapFormDispatch } from "~/providers/swap-form";
import { EVM_ASSET_QUERY_FACTORIES } from "~/queries/evm-asset-query-factories";
import { tonAssetQueryFactory } from "~/queries/ton-assets";
import { tronAssetQueryFactory } from "~/queries/tron-assets";

const useChainConfigs = () => {
  const { walletAddressByChain } = useConnectedWallets();

  const wagmiConfig = useWagmiConfig();
  const getTronWebClient = useTronWebClient();

  const chainConfigs: ChainTabConfig[] = [
    ...chainsByFamily[ChainFamily.EVM].map((evmChain): ChainTabConfig => ({
      chain: evmChain,
      fetchQueryOptions: EVM_ASSET_QUERY_FACTORIES[evmChain].fetch({
        walletAddress: walletAddressByChain[evmChain],
        wagmiConfig,
      }),
      searchQueryOptions: (searchTerm) =>
        EVM_ASSET_QUERY_FACTORIES[evmChain].search({
          searchTerm,
          walletAddress: walletAddressByChain[evmChain],
          wagmiConfig,
        }),
    })),
    {
      chain: Chain.TON,
      fetchQueryOptions: tonAssetQueryFactory.fetch({
        walletAddress: walletAddressByChain[Chain.TON],
      }),
      searchQueryOptions: (searchTerm) =>
        tonAssetQueryFactory.search({
          searchTerms: [searchTerm],
          walletAddress: walletAddressByChain[Chain.TON],
        }),
    },
    {
      chain: Chain.TRON,
      fetchQueryOptions: tronAssetQueryFactory.fetch({
        getTronWebClient,
        walletAddress: walletAddressByChain[Chain.TRON],
      }),
      searchQueryOptions: (searchTerm) =>
        tronAssetQueryFactory.search({
          getTronWebClient,
          searchTerm,
          walletAddress: walletAddressByChain[Chain.TRON],
        }),
    },
  ];

  return chainConfigs as [ChainTabConfig, ...ChainTabConfig[]];
};

export const SwapForm = (props: { className?: string }) => {
  return (
    <Card {...props}>
      <CardContent className="flex flex-col gap-4 p-6">
        <section>
          <InputAssetHeader className="mb-1" />
          <div className="flex gap-2">
            <InputAssetSelect className="w-1/3" />
            <InputAssetInput className="flex-1" />
          </div>
        </section>

        <section className="flex flex-col gap-1">
          <OutputAssetHeader />
          <div className="flex gap-2">
            <OutputAssetSelect className="w-1/3" />
            <OutputAssetInput className="flex-1" />
          </div>
        </section>
      </CardContent>
    </Card>
  );
};

const validateFloatValue = (value: string): boolean =>
  /^([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(value);

const InputAssetHeader = (props: { className?: string }) => {
  return (
    <div
      {...props}
      className={cn(
        "flex items-center justify-between gap-2 text-sm text-muted-foreground",
        props.className,
      )}
    >
      You send
    </div>
  );
};

const InputAssetSelect = (props: { className?: string }) => {
  const { inputAssetId } = useSwapForm();
  const dispatch = useSwapFormDispatch();
  const { getAssetById } = useAssets();
  const chainConfigs = useChainConfigs();

  const inputAsset = inputAssetId ? (getAssetById(inputAssetId) ?? null) : null;

  return (
    <AssetSelect
      {...props}
      chains={chainConfigs}
      selectedAsset={inputAsset}
      onAssetSelect={(asset) =>
        dispatch({ type: "SET_INPUT_ASSET_ID", payload: asset })
      }
    />
  );
};

const InputAssetInput = (props: { className?: string }) => {
  const { inputAssetId, inputUnits } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const handleInputUpdate = ({
    target,
  }: React.ChangeEvent<HTMLInputElement>) => {
    if (target.value && !validateFloatValue(target.value)) return;

    dispatch({ type: "SET_INPUT_UNITS", payload: target.value });
  };

  return (
    <Input
      {...props}
      disabled={!inputAssetId}
      value={inputUnits}
      onChange={handleInputUpdate}
    />
  );
};

const OutputAssetHeader = (props: { className?: string }) => {
  return (
    <div
      {...props}
      className={cn(
        "flex items-center justify-between gap-2 text-sm text-muted-foreground",
        props.className,
      )}
    >
      You receive
    </div>
  );
};

const OutputAssetSelect = (props: { className?: string }) => {
  const { outputAssetId, inputAssetId } = useSwapForm();
  const dispatch = useSwapFormDispatch();
  const { getAssetById } = useAssets();
  const chainConfigs = useChainConfigs();

  const inputAsset = inputAssetId ? (getAssetById(inputAssetId) ?? null) : null;
  const outputAsset = outputAssetId
    ? (getAssetById(outputAssetId) ?? null)
    : null;

  return (
    <AssetSelect
      {...props}
      chains={chainConfigs}
      selectedAsset={outputAsset}
      excludeAsset={inputAsset}
      onAssetSelect={(asset) =>
        dispatch({ type: "SET_OUTPUT_ASSET_ID", payload: asset })
      }
    />
  );
};

const OutputAssetInput = (props: { className?: string }) => {
  const { outputAssetId, outputUnits } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const handleInputUpdate = ({
    target,
  }: React.ChangeEvent<HTMLInputElement>) => {
    if (target.value && !validateFloatValue(target.value)) return;

    dispatch({ type: "SET_OUTPUT_UNITS", payload: target.value });
  };

  return (
    <Input
      {...props}
      disabled={!outputAssetId}
      value={outputUnits}
      onChange={handleInputUpdate}
    />
  );
};
