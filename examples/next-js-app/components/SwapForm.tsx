"use client";

import type { AssetInfo } from "@ston-fi/omniston-sdk-react";
import type { ChangeEvent } from "react";

import { AssetSelect } from "@/components/AssetSelect";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addressEquals } from "@/helpers/addressEquals";
import { useAssets } from "@/hooks";
import { cn } from "@/lib/utils";
import { useSwapForm, useSwapFormDispatch } from "@/providers/swap-form";

export const SwapForm = (props: { className?: string }) => {
  return (
    <Card {...props}>
      <CardContent className="flex flex-col gap-4 p-6">
        <section>
          <OfferAssetHeader className="mb-1" />
          <div className="flex gap-2">
            <OfferAssetSelect className="min-w-[150px] w-1/3 max-w-[150px]" />
            <OfferAssetInput />
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

const OfferAssetHeader = (props: { className?: string }) => {
  return (
    <div
      {...props}
      className={cn(
        "flex items-center justify-between gap-2 text-sm text-muted-foreground",
        props.className,
      )}
    >
      You offer
    </div>
  );
};

const OfferAssetSelect = (props: { className?: string }) => {
  const { offerAsset } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const { data, isLoading } = useAssets();

  const handleAssetSelect = (asset: AssetInfo | null) => {
    dispatch({ type: "SET_OFFER_ASSET", payload: asset });
  };

  return (
    <AssetSelect
      {...props}
      assets={data}
      selectedAsset={offerAsset}
      onAssetSelect={handleAssetSelect}
      loading={isLoading}
    />
  );
};

const OfferAssetInput = (props: { className?: string }) => {
  const { offerAsset, offerAmount } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const handleInputUpdate = ({ target }: ChangeEvent<HTMLInputElement>) => {
    if (target.value && !validateFloatValue(target.value)) return;

    dispatch({ type: "SET_OFFER_AMOUNT", payload: target.value });
  };

  return (
    <Input
      {...props}
      disabled={!offerAsset}
      value={offerAmount}
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
  const { askAsset, offerAsset } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const { data, isLoading } = useAssets({
    select: (data) =>
      data.filter(
        ({ address }) => !addressEquals(address, offerAsset?.address),
      ),
  });

  const handleAssetSelect = (asset: AssetInfo | null) => {
    dispatch({ type: "SET_ASK_ASSET", payload: asset });
  };

  return (
    <AssetSelect
      {...props}
      assets={data}
      selectedAsset={askAsset}
      onAssetSelect={handleAssetSelect}
      loading={isLoading}
    />
  );
};

const AskAssetInput = (props: { className?: string }) => {
  const { askAsset, askAmount } = useSwapForm();
  const dispatch = useSwapFormDispatch();

  const handleInputUpdate = ({ target }: ChangeEvent<HTMLInputElement>) => {
    if (target.value && !validateFloatValue(target.value)) return;

    dispatch({ type: "SET_ASK_AMOUNT", payload: target.value });
  };

  return (
    <Input
      {...props}
      disabled={!askAsset}
      value={askAmount}
      onChange={handleInputUpdate}
    />
  );
};
