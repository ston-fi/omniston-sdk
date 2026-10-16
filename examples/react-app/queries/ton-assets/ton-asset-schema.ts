import * as z from "zod";

import { tonAddressSchema } from "~/lib/ton/address";
import type { Asset } from "~/models/asset";
import { Chain } from "~/models/chain";

export const tonAssetSchema = z.object({
  kind: z.literal(["Ton", "Jetton", "Wton"] as const),
  contractAddress: tonAddressSchema,
  dexPriceUsd: z.coerce.number().optional(),
  meta: z.object({
    decimals: z.coerce.number(),
    symbol: z.string().optional(),
    displayName: z.string().optional(),
    imageUrl: z.url().optional(),
  }),
  walletAddress: z.string().optional(),
  balance: z.coerce.bigint().optional(),
});

export type TonAsset = z.infer<typeof tonAssetSchema>;

export function transformToAsset(tonAsset: TonAsset): Asset {
  return {
    id: {
      chain: {
        $case: Chain.TON,
        value: {
          kind:
            tonAsset.kind === "Ton"
              ? { $case: "native", value: {} }
              : { $case: "jetton", value: tonAsset.contractAddress },
        },
      },
    },
    metadata: tonAsset.meta,
    balance: tonAsset.balance,
    priceUsd: tonAsset.dexPriceUsd,
    extra: {},
  };
}
