"use server";

import { type AssetMetadata, assetMetadataSchema } from "@/models/asset";

import { stonApiClient } from "./ston-api-client";
import { retrieveEnvVariable } from "./utils";

const ASSET_QUERY_CONDITION = retrieveEnvVariable(
  "OMNIDEMO__STON_API__ASSETS_QUERY_CONDITION",
);
const ASSET_SEARCH_CONDITION = retrieveEnvVariable(
  "OMNIDEMO__STON_API__ASSETS_SEARCH_CONDITION",
);

export async function fetchAssets({
  condition,
  unconditionalAssets,
  walletAddress,
}: {
  condition?: string;
  unconditionalAssets?: string[];
  walletAddress?: string;
}): Promise<AssetMetadata[]> {
  const response = await stonApiClient.queryAssets({
    condition: condition
      ? `${ASSET_QUERY_CONDITION} & ${condition}`
      : ASSET_QUERY_CONDITION,
    walletAddress,
    unconditionalAssets,
  });

  const assets = response.reduce<AssetMetadata[]>((acc, asset) => {
    const parsedData = assetMetadataSchema.safeParse(asset);

    if (parsedData.success) {
      acc.push(parsedData.data);
    }

    return acc;
  }, []);

  return assets;
}

export async function searchAssets({
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
}): Promise<AssetMetadata[]> {
  const response = await stonApiClient.queryAssets({
    limit,
    searchTerms,
    condition: condition
      ? `${ASSET_SEARCH_CONDITION} & ${condition}`
      : ASSET_SEARCH_CONDITION,
    walletAddress,
    unconditionalAssets,
  });

  const assets = response.reduce<AssetMetadata[]>((acc, asset) => {
    const parsedData = assetMetadataSchema.safeParse(asset);

    if (parsedData.success) {
      acc.push(parsedData.data);
    }

    return acc;
  }, []);

  return assets;
}
