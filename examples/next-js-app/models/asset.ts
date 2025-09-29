import { z } from "zod";

export const assetMetadataSchema = z.object({
  kind: z.literal(["Ton", "Jetton", "Wton"] as const),
  contract_address: z.string(),
  dex_price_usd: z.coerce.number().optional(),
  meta: z.object({
    decimals: z.coerce.number(),
    symbol: z.string(),
    display_name: z.string().optional(),
    image_url: z.url().optional(),
  }),
  wallet_address: z.string().optional(),
  balance: z.coerce.bigint().optional(),
});

export type AssetMetadata = z.infer<typeof assetMetadataSchema>;
