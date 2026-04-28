import { Chain } from "@/models/chain";

import { isTonAddress } from "./ton/address";
import { isErc20Address } from "./evm/address";

export function isValidAddress(chain: Chain, src: string) {
  switch (chain) {
    case Chain.TON: {
      return isTonAddress(src);
    }
    case Chain.BASE: {
      return isErc20Address(src);
    }
    case Chain.POLYGON: {
      return isErc20Address(src);
    }
    default: {
      chain satisfies never;
      throw new Error(`Unexpected chain: ${chain}`);
    }
  }
}
