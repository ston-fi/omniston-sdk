import {
  AssetInfo as ApiAssetInfo,
  AssetsResponse as ApiAssetsResponse,
} from "@/api/messages/omni/v1beta5/trader/asset";
import type { Converter, SetNonNullable } from "@/types";

export type AssetInfo = SetNonNullable<ApiAssetInfo, "address">;

export const AssetInfo = ApiAssetInfo as Converter<AssetInfo>;

export type AssetsResponse = { assets: AssetInfo[] };

export const AssetsResponse = ApiAssetsResponse as Converter<AssetsResponse>;
