import { z } from "zod";

import type { Asset } from "@/models/asset";
import { Chain } from "@/models/chain";
import { erc20AddressSchema } from "@/lib/evm/address";

export const polygonAssetSchema = z.object({
  address: z.union([erc20AddressSchema, z.literal("native")]),
  metadata: z.object({
    decimals: z.coerce.number(),
    symbol: z.string(),
    displayName: z.string().optional(),
    imageUrl: z.url().optional(),
  }),
  balance: z.coerce.bigint().optional(),
});

type PolygonAsset = z.infer<typeof polygonAssetSchema>;

export function transformToAsset(baseAsset: PolygonAsset): Asset {
  return {
    id: {
      chain: {
        $case: Chain.POLYGON,
        value: {
          kind:
            baseAsset.address === "native"
              ? { $case: "native", value: {} }
              : { $case: "erc20", value: baseAsset.address },
        },
      },
    },
    metadata: baseAsset.metadata,
    balance: baseAsset.balance,
    extra: {},
  };
}
