import type { AssetId, ChainAddress } from "@ston-fi/omniston-sdk";
import z from "zod";

import { trimStringWithEllipsis } from "@/lib/utils";

import { Chain } from "./chain";

export const addressSchema = z.object({
  chain: z.discriminatedUnion("$case", [
    z.object({
      $case: z.literal(Chain.TON),
      value: z.string().nonempty(),
    }),
    z.object({
      $case: z.literal(Chain.BASE),
      value: z.string().nonempty(),
    }),
    z.object({
      $case: z.literal(Chain.POLYGON),
      value: z.string().nonempty(),
    }),
  ]),
}) satisfies z.ZodType<ChainAddress>;

export function addressFromAssetId(assetId: AssetId): ChainAddress | null {
  const chainCase = assetId.chain.$case;

  switch (chainCase) {
    case Chain.TON: {
      switch (assetId.chain.value.kind.$case) {
        case "jetton": {
          return {
            chain: {
              $case: Chain.TON,
              value: assetId.chain.value.kind.value,
            },
          };
        }
        default: {
          return null;
        }
      }
    }
    case Chain.BASE: {
      switch (assetId.chain.value.kind.$case) {
        case "erc20": {
          return {
            chain: {
              $case: Chain.BASE,
              value: assetId.chain.value.kind.value,
            },
          };
        }
        default: {
          return null;
        }
      }
    }
    case Chain.POLYGON: {
      switch (assetId.chain.value.kind.$case) {
        case "erc20": {
          return {
            chain: {
              $case: Chain.POLYGON,
              value: assetId.chain.value.kind.value,
            },
          };
        }
        default: {
          return null;
        }
      }
    }
    default: {
      throw new Error(`Unexpected chain: ${chainCase}`);
    }
  }
}

export function truncateAddress(address: ChainAddress): string {
  let fullAddress: string;

  const chainCase = address.chain.$case;

  switch (chainCase) {
    case Chain.TON: {
      fullAddress = address.chain.value;
      break;
    }
    case Chain.BASE: {
      fullAddress = address.chain.value;
      break;
    }
    case Chain.POLYGON: {
      fullAddress = address.chain.value;
      break;
    }
    default: {
      throw new Error(`Unexpected chain: ${chainCase}`);
    }
  }

  return trimStringWithEllipsis(fullAddress, 6, 4);
}
