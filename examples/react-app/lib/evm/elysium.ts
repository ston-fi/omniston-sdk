import { defineChain } from "viem";

export const elysium = defineChain({
  id: 99901,
  name: "Elysium",
  nativeCurrency: {
    name: "Hyperliquid",
    symbol: "HYPE",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.elysium.kinetiq.xyz"],
    },
  },
});
