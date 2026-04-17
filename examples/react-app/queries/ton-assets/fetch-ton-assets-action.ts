"use server";

import type { Asset } from "@/models/asset";

import { stonApiClient } from "@/lib/ston-api-client";
import { retrieveEnvVariable } from "@/lib/utils";

import { tonAssetSchema, transformToAsset } from "./ton-asset-schema";

const ASSET_QUERY_CONDITION = retrieveEnvVariable("OMNIDEMO__STON_API__ASSETS_QUERY_CONDITION");

export async function fetchTonAssets({
  condition,
  unconditionalAssets,
  walletAddress,
}: {
  condition?: string;
  unconditionalAssets?: string[];
  walletAddress?: string;
}): Promise<Asset[]> {
  const response = await stonApiClient.queryAssets({
    condition: condition ? `${ASSET_QUERY_CONDITION} & ${condition}` : ASSET_QUERY_CONDITION,
    walletAddress,
    unconditionalAssets,
  });

  const assets = response.reduce<Asset[]>((acc, asset) => {
    const parsedData = tonAssetSchema.safeParse(asset);

    if (parsedData.success) {
      acc.push(transformToAsset(parsedData.data));
    }

    return acc;
  }, []);

  return assets;
}
