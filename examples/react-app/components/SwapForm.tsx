"use client";

import { useConfig as useWagmiConfig } from "wagmi";

import { AssetSelect, type ChainTabConfig } from "~/components/AssetSelect";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { Chain } from "~/models/chain";
import { useSwapForm, useSwapFormDispatch } from "~/providers/swap-form";
import { tonAssetQueryFactory } from "~/queries/ton-assets";
import { baseAssetQueryFactory } from "~/queries/base-assets";
import { polygonAssetQueryFactory } from "~/queries/polygon-assets";
import { ethereumAssetQueryFactory } from "~/queries/ethereum-assets";
import { bnbAssetQueryFactory } from "~/queries/bnb-assets";
import { useAssets } from "~/providers/assets";
import { useConnectedWallets } from "~/hooks/useConnectedWallets";
import { avalancheAssetQueryFactory } from "~/queries/avalanche-assets";
import { arbitrumAssetQueryFactory } from "~/queries/arbitrum-assets";
import { tronAssetQueryFactory } from "~/queries/tron-assets";
import { useTronWebClient } from "~/hooks/useTronWebClient";
import { robinhoodAssetQueryFactory } from "~/queries/robinhood-assets";

const useChainConfigs = (): [ChainTabConfig, ...ChainTabConfig[]] => {
  const {
    arbitrum: arbitrumWalletAddress,
    avalanche: avalancheWalletAddress,
    base: baseWalletAddress,
    bnb: bnbWalletAddress,
    ethereum: ethereumWalletAddress,
    polygon: polygonWalletAddress,
    robinhood: robinhoodWalletAddress,
    ton: tonWalletAddress,
    tron: tronWalletAddress,
  } = useConnectedWallets();

  const wagmiConfig = useWagmiConfig();
  const getTronWebClient = useTronWebClient();

  return [
    {
      chain: Chain.ARBITRUM,
      fetchQueryOptions: arbitrumAssetQueryFactory.fetch({
        walletAddress: arbitrumWalletAddress,
        wagmiConfig,
      }),
      searchQueryOptions: (searchTerm) =>
        arbitrumAssetQueryFactory.search({
          searchTerm,
          walletAddress: arbitrumWalletAddress,
          wagmiConfig,
        }),
    },
    {
      chain: Chain.AVALANCHE,
      fetchQueryOptions: avalancheAssetQueryFactory.fetch({
        walletAddress: avalancheWalletAddress,
        wagmiConfig,
      }),
      searchQueryOptions: (searchTerm) =>
        avalancheAssetQueryFactory.search({
          searchTerm,
          walletAddress: avalancheWalletAddress,
          wagmiConfig,
        }),
    },
    {
      chain: Chain.BASE,
      fetchQueryOptions: baseAssetQueryFactory.fetch({
        walletAddress: baseWalletAddress,
        wagmiConfig,
      }),
      searchQueryOptions: (searchTerm) =>
        baseAssetQueryFactory.search({
          searchTerm,
          walletAddress: baseWalletAddress,
          wagmiConfig,
        }),
    },
    {
      chain: Chain.BNB,
      fetchQueryOptions: bnbAssetQueryFactory.fetch({
        walletAddress: bnbWalletAddress,
        wagmiConfig,
      }),
      searchQueryOptions: (searchTerm) =>
        bnbAssetQueryFactory.search({
          searchTerm,
          walletAddress: bnbWalletAddress,
          wagmiConfig,
        }),
    },

    {
      chain: Chain.ETHEREUM,
      fetchQueryOptions: ethereumAssetQueryFactory.fetch({
        walletAddress: ethereumWalletAddress,
        wagmiConfig,
      }),
      searchQueryOptions: (searchTerm) =>
        ethereumAssetQueryFactory.search({
          searchTerm,
          walletAddress: ethereumWalletAddress,
          wagmiConfig,
        }),
    },
    {
      chain: Chain.POLYGON,
      fetchQueryOptions: polygonAssetQueryFactory.fetch({
        walletAddress: polygonWalletAddress,
        wagmiConfig,
      }),
      searchQueryOptions: (searchTerm) =>
        polygonAssetQueryFactory.search({
          searchTerm,
          walletAddress: polygonWalletAddress,
          wagmiConfig,
        }),
    },
    {
      chain: Chain.ROBINHOOD,
      fetchQueryOptions: robinhoodAssetQueryFactory.fetch({
        walletAddress: robinhoodWalletAddress,
        wagmiConfig,
      }),
      searchQueryOptions: (searchTerm) =>
        robinhoodAssetQueryFactory.search({
          searchTerm,
          walletAddress: robinhoodWalletAddress,
          wagmiConfig,
        }),
    },
    {
      chain: Chain.TON,
      fetchQueryOptions: tonAssetQueryFactory.fetch({
        walletAddress: tonWalletAddress,
      }),
      searchQueryOptions: (searchTerm) =>
        tonAssetQueryFactory.search({
          searchTerms: [searchTerm],
          walletAddress: tonWalletAddress,
        }),
    },
    {
      chain: Chain.TRON,
      fetchQueryOptions: tronAssetQueryFactory.fetch({
        getTronWebClient,
        walletAddress: tronWalletAddress,
      }),
      searchQueryOptions: (searchTerm) =>
        tronAssetQueryFactory.search({
          getTronWebClient,
          searchTerm,
          walletAddress: tronWalletAddress,
        }),
    },
  ];
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
      onAssetSelect={(asset) => dispatch({ type: "SET_INPUT_ASSET_ID", payload: asset })}
    />
  );
};

const InputAssetInput = (props: { className?: string }) => {
  const { inputAssetId, inputUnits } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const handleInputUpdate = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    if (target.value && !validateFloatValue(target.value)) return;

    dispatch({ type: "SET_INPUT_UNITS", payload: target.value });
  };

  return (
    <Input {...props} disabled={!inputAssetId} value={inputUnits} onChange={handleInputUpdate} />
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
  const outputAsset = outputAssetId ? (getAssetById(outputAssetId) ?? null) : null;

  return (
    <AssetSelect
      {...props}
      chains={chainConfigs}
      selectedAsset={outputAsset}
      excludeAsset={inputAsset}
      onAssetSelect={(asset) => dispatch({ type: "SET_OUTPUT_ASSET_ID", payload: asset })}
    />
  );
};

const OutputAssetInput = (props: { className?: string }) => {
  const { outputAssetId, outputUnits } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const handleInputUpdate = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    if (target.value && !validateFloatValue(target.value)) return;

    dispatch({ type: "SET_OUTPUT_UNITS", payload: target.value });
  };

  return (
    <Input {...props} disabled={!outputAssetId} value={outputUnits} onChange={handleInputUpdate} />
  );
};
