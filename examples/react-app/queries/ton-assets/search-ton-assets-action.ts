"use server";

import { type Asset } from "@/models/asset";
import { stonApiClient } from "@/lib/ston-api-client";
import { retrieveEnvVariable } from "@/lib/utils";

import { tonAssetSchema, transformToAsset } from "./ton-asset-schema";

const ASSET_SEARCH_CONDITION = retrieveEnvVariable("OMNIDEMO__STON_API__ASSETS_SEARCH_CONDITION");

export async function searchTonAssets({
  searchTerms,
  condition,
  unconditionalAssets,
  walletAddress,
  limit = 50,
}: {
  searchTerms: string[];
  condition?: string;
  unconditionalAssets?: string[];
  walletAddress?: string;
  limit?: number;
}): Promise<Asset[]> {
  const response = await stonApiClient.queryAssets({
    limit,
    searchTerms,
    condition: condition ? `${ASSET_SEARCH_CONDITION} & ${condition}` : ASSET_SEARCH_CONDITION,
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
