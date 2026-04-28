import type { AssetId } from "@ston-fi/omniston-sdk-react";

import { z } from "zod";

import type { Brand } from "@/lib/types";

import { Chain } from "./chain";

export const assetIdSchema = z.object({
  chain: z.discriminatedUnion("$case", [
    z.object({
      $case: z.literal(Chain.TON),
      value: z.object({
        kind: z.discriminatedUnion("$case", [
          z.object({
            $case: z.literal("native"),
            value: z.object({}),
          }),
          z.object({
            $case: z.literal("jetton"),
            value: z.string().nonempty(),
          }),
        ]),
      }),
    }),
    z.object({
      $case: z.literal(Chain.BASE),
      value: z.object({
        kind: z.discriminatedUnion("$case", [
          z.object({
            $case: z.literal("native"),
            value: z.object({}),
          }),
          z.object({
            $case: z.literal("erc20"),
            value: z.string().nonempty(),
          }),
        ]),
      }),
    }),
    z.object({
      $case: z.literal(Chain.POLYGON),
      value: z.object({
        kind: z.discriminatedUnion("$case", [
          z.object({
            $case: z.literal("native"),
            value: z.object({}),
          }),
          z.object({
            $case: z.literal("erc20"),
            value: z.string().nonempty(),
          }),
        ]),
      }),
    }),
  ]),
}) satisfies z.ZodType<AssetId>;

export type SerializedAssetId = Brand<string, "SerializedAssetId">;

export function serializeAssetId(assetId: AssetId): SerializedAssetId {
  return JSON.stringify(assetIdSchema.parse(assetId)) as SerializedAssetId;
}

export function deserializeAssetId(serialized: string): AssetId {
  return assetIdSchema.parse(JSON.parse(serialized));
}

export function isAssetIdEqual(
  a: AssetId | null | undefined,
  b: AssetId | null | undefined,
): boolean {
  if (!a || !b) return false;
  return serializeAssetId(a) === serializeAssetId(b);
}
