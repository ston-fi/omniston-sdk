import type { AssetId, ChainAddress } from "@ston-fi/omniston-sdk-react";
import z from "zod";

import { trimStringWithEllipsis } from "~/lib/utils";
import { isTonAddress } from "~/lib/ton/address";
import { isErc20Address } from "~/lib/evm/address";
import { isTronAddress } from "~/lib/tron/address";

import { Chain } from "./chain";
import { ChainFamily, chainFamilyByChain, chainsByFamily } from "./chain-family";

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
  const chainFamily = chainFamilyByChain[chainCase];

  switch (chainFamily) {
    case ChainFamily.TON: {
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
    case ChainFamily.EVM: {
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
    case ChainFamily.TRON: {
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
      chainFamily satisfies never;
      throw new Error(`Unexpected chain family: ${chainFamily}`);
    }
  }
}

export function isValidAddress(chain: Chain, src: string) {
  const chainFamily = chainFamilyByChain[chain];

  switch (chainFamily) {
    case ChainFamily.TON: {
      return isTonAddress(src);
    }
    case ChainFamily.EVM: {
      return isErc20Address(src);
    }
    case ChainFamily.TRON: {
      return isTronAddress(src);
    }
    default: {
      chainFamily satisfies never;
      throw new Error(`Unexpected chain family: ${chainFamily}`);
    }
  }
}

export function truncateAddress(address: ChainAddress): string {
  return trimStringWithEllipsis(address.chain.value, 6, 4);
}
