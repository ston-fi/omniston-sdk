import { z } from "zod";

export const assetMetadataSchema = z.object({
  kind: z.literal(["Ton", "Jetton", "Wton"] as const),
  contractAddress: z.string(),
  dexPriceUsd: z.coerce.number().optional(),
  meta: z.object({
    decimals: z.coerce.number(),
    symbol: z.string(),
    displayName: z.string().optional(),
    imageUrl: z.url().optional(),
  }),
  walletAddress: z.string().optional(),
  balance: z.coerce.bigint().optional(),
});

export type AssetMetadata = z.infer<typeof assetMetadataSchema>;
