"use server";

import { z } from "zod";

import { assetMetadataSchema } from "@/models/asset";
import { retrieveEnvVariable } from "./utils";

const STON_API_URL = retrieveEnvVariable("OMNIDEMO__STON_API");
const ASSET_QUERY_CONDITION = retrieveEnvVariable(
  "OMNIDEMO__STON_API__ASSETS_QUERY_CONDITION",
);
const ASSET_SEARCH_CONDITION = retrieveEnvVariable(
  "OMNIDEMO__STON_API__ASSETS_SEARCH_CONDITION",
);

const assetsQueryResponseSchema = z.object({
  asset_list: z.array(assetMetadataSchema),
});

export type AssetsQueryResponse = z.infer<typeof assetsQueryResponseSchema>;

export async function fetchAssets({
  condition,
  unconditionalAssets,
  walletAddress,
}: {
  condition?: string;
  unconditionalAssets?: string[];
  walletAddress?: string;
}): Promise<AssetsQueryResponse> {
  const response = await fetch(`${STON_API_URL}/v1/assets/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      condition: condition
        ? `${ASSET_QUERY_CONDITION} & ${condition}`
        : ASSET_QUERY_CONDITION,
      wallet_address: walletAddress,
      unconditional_asset: unconditionalAssets,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch assets metadata");
  }

  const rawData = await response.json();
  const parsedData = assetsQueryResponseSchema.safeParse(rawData);

  if (!parsedData.success) {
    console.error("Parse error:", parsedData.error);
    throw new Error("Invalid response data", { cause: parsedData.error });
  }

  return parsedData.data;
}

export async function searchAssets({
  searchTerm,
  condition,
  unconditionalAssets,
  walletAddress,
}: {
  searchTerm: string;
  condition?: string;
  unconditionalAssets?: string[];
  walletAddress?: string;
}): Promise<AssetsQueryResponse> {
  const searchParams = new URLSearchParams();

  searchParams.append("limit", "50");
  searchParams.append("search_string", searchTerm);
  searchParams.append(
    "condition",
    condition
      ? `${ASSET_SEARCH_CONDITION} & ${condition}`
      : ASSET_SEARCH_CONDITION,
  );

  if (walletAddress) {
    searchParams.append("wallet_address", walletAddress);
  }

  if (unconditionalAssets && unconditionalAssets.length > 0) {
    unconditionalAssets.forEach((asset) => {
      searchParams.append("unconditional_asset", asset);
    });
  }

  const response = await fetch(
    `${STON_API_URL}/v1/assets/search?${searchParams.toString()}`,
    { method: "POST" },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch assets metadata");
  }

  const rawData = await response.json();
  const parsedData = assetsQueryResponseSchema.safeParse(rawData);

  if (!parsedData.success) {
    console.error("Parse error:", parsedData.error);
    throw new Error("Invalid response data", { cause: parsedData.error });
  }

  return parsedData.data;
}
