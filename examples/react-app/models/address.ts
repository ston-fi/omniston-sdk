import type { AssetId, ChainAddress } from "@ston-fi/omniston-sdk";
import z from "zod";

import { trimStringWithEllipsis } from "~/lib/utils";
import { isTonAddress } from "~/lib/ton/address";
import { isErc20Address } from "~/lib/evm/address";
import { isTronAddress } from "~/lib/tron/address";

import { Chain } from "./chain";
import { ChainFamily, chainsByFamily } from "./chain-family";

export const addressSchema = z.object({
  chain: z.discriminatedUnion("$case", [
    z.object({
      $case: z.literal(Chain.TON),
      value: z.string().nonempty(),
    }),
    z.object({
      $case: z.literal(chainsByFamily[ChainFamily.EVM]),
      value: z.string().nonempty(),
    }),
    z.object({
      $case: z.literal(Chain.TRON),
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
    case Chain.ARBITRUM:
    case Chain.AVALANCHE:
    case Chain.BASE:
    case Chain.BNB:
    case Chain.ETHEREUM:
    case Chain.POLYGON:
    case Chain.ROBINHOOD: {
      switch (assetId.chain.value.kind.$case) {
        case "erc20": {
          return {
            chain: {
              $case: chainCase,
              value: assetId.chain.value.kind.value,
            },
          };
        }
        default: {
          return null;
        }
      }
    }
    case Chain.TRON: {
      switch (assetId.chain.value.kind.$case) {
        case "trc20": {
          return {
            chain: {
              $case: Chain.TRON,
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

export function isValidAddress(chain: Chain, src: string) {
  switch (chain) {
    case Chain.TON: {
      return isTonAddress(src);
    }
    case Chain.ARBITRUM:
    case Chain.AVALANCHE:
    case Chain.BASE:
    case Chain.BNB:
    case Chain.ETHEREUM:
    case Chain.POLYGON:
    case Chain.ROBINHOOD: {
      return isErc20Address(src);
    }
    case Chain.TRON: {
      return isTronAddress(src);
    }
    default: {
      chain satisfies never;
      throw new Error(`Unexpected chain: ${chain}`);
    }
  }
}

export function truncateAddress(address: ChainAddress): string {
  return trimStringWithEllipsis(address.chain.value, 6, 4);
}
