import { z } from "zod";

import type { Asset } from "~/models/asset";
import { tronAddressSchema } from "~/lib/tron/address";
import { Chain } from "~/models/chain";

export const tronAssetMockSchema = z.object({
  address: z.union([tronAddressSchema, z.literal("native")]),
  metadata: z.object({
    decimals: z.coerce.number(),
    symbol: z.string(),
    displayName: z.string().optional(),
    imageUrl: z.url().optional(),
  }),
  balance: z.coerce.bigint().optional(),
});

export type TronAssetMock = z.infer<typeof tronAssetMockSchema>;

export function transformToAsset(tronAsset: TronAssetMock): Asset {
  return {
    id: {
      chain: {
        $case: Chain.TRON,
        value: {
          kind:
            tronAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "trc20", value: tronAsset.address },
        },
      },
    },
    metadata: tronAsset.metadata,
    balance: tronAsset.balance,
    extra: {},
  };
}
