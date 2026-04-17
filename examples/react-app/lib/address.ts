import { Chain } from "@/models/chain";

import { isTonAddress } from "./ton/address";
import { isErc20Address } from "./evm/address";

export function isValidAddress(chain: `${Chain}` | (string & {}), src: string) {
  switch (chain) {
    case Chain.TON: {
      return isTonAddress(src);
    }
    case Chain.BASE: {
      return isErc20Address(src);
    }
    default: {
      throw new Error(`Unexpected chain: ${chain}`);
    }
  }
}
