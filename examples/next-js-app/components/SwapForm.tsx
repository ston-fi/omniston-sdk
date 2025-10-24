"use client";

import type { ChangeEvent } from "react";

import { AssetSelect } from "@/components/AssetSelect";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAssets } from "@/providers/assets";
import { useSwapForm, useSwapFormDispatch } from "@/providers/swap-form";

export const SwapForm = (props: { className?: string }) => {
  return (
    <Card {...props}>
      <CardContent className="flex flex-col gap-4 p-6">
        <section>
          <BidAssetHeader className="mb-1" />
          <div className="flex gap-2">
            <OfferAssetSelect className="min-w-[150px] w-1/3 max-w-[150px]" />
            <BidAssetInput />
          </div>
        </section>

        <section className="flex flex-col gap-1">
          <AskAssetHeader />
          <div className="flex gap-2">
            <AskAssetSelect className="min-w-[150px] w-1/3 max-w-[150px]" />
            <AskAssetInput />
          </div>
        </section>
      </CardContent>
    </Card>
  );
};

const validateFloatValue = (value: string): boolean =>
  /^([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(value);

const BidAssetHeader = (props: { className?: string }) => {
  return (
    <div
      {...props}
      className={cn(
        "flex items-center justify-between gap-2 text-sm text-muted-foreground",
        props.className,
      )}
    >
      You bid
    </div>
  );
};

const OfferAssetSelect = (props: { className?: string }) => {
  const { bidAddress } = useSwapForm();
  const dispatch = useSwapFormDispatch();
  const { assetsQuery, getAssetByAddress } = useAssets();
  const bidAsset = getAssetByAddress(bidAddress);

  const assets = [...(assetsQuery.data ?? new Map()).values()];

  return (
    <AssetSelect
      {...props}
      assets={assets}
      selectedAsset={bidAsset ?? null}
      onAssetSelect={(asset) => {
        dispatch({
          type: "SET_BID_ASSET",
          payload: asset ? asset.contractAddress : "",
        });
      }}
      loading={assetsQuery.isLoading}
    />
  );
};

const BidAssetInput = (props: { className?: string }) => {
  const { bidAddress, bidAmount } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const handleInputUpdate = ({ target }: ChangeEvent<HTMLInputElement>) => {
    if (target.value && !validateFloatValue(target.value)) return;

    dispatch({ type: "SET_BID_AMOUNT", payload: target.value });
  };

  return (
    <Input
      {...props}
      disabled={!bidAddress}
      value={bidAmount}
      onChange={handleInputUpdate}
    />
  );
};

const AskAssetHeader = (props: { className?: string }) => {
  return (
    <div
      {...props}
      className={cn(
        "flex items-center justify-between gap-2 text-sm text-muted-foreground",
        props.className,
      )}
    >
      You ask
    </div>
  );
};

const AskAssetSelect = (props: { className?: string }) => {
  const { askAddress, bidAddress } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const { getAssetByAddress, assetsQuery } = useAssets();

  const askAsset = getAssetByAddress(askAddress);
  const bidAsset = getAssetByAddress(bidAddress);

  const assets = [...(assetsQuery.data ?? new Map()).values()].filter(
    (asset) => asset.contractAddress !== bidAsset?.contractAddress,
  );

  return (
    <AssetSelect
      {...props}
      assets={assets}
      selectedAsset={askAsset ?? null}
      onAssetSelect={(asset) => {
        dispatch({
          type: "SET_ASK_ASSET",
          payload: asset ? asset.contractAddress : "",
        });
      }}
      loading={assetsQuery.isLoading}
    />
  );
};

const AskAssetInput = (props: { className?: string }) => {
  const { askAddress, askAmount } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const handleInputUpdate = ({ target }: ChangeEvent<HTMLInputElement>) => {
    if (target.value && !validateFloatValue(target.value)) return;

    dispatch({ type: "SET_ASK_AMOUNT", payload: target.value });
  };

  return (
    <Input
      {...props}
      disabled={!askAddress}
      value={askAmount}
      onChange={handleInputUpdate}
    />
  );
};
