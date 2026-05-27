"use server";

import { type EvmChain, EVM_CHAINS } from "@/models/chain";

const ENV_ASSETS_MOCK = Object.values(EVM_CHAINS).reduce(
  (acc, chain) => {
    const envKey = `OMNIDEMO__EVM_ASSETS_MOCK__${chain.toUpperCase()}`;
    const envValue = process.env[envKey];

    return {
      ...acc,
      [chain]: envValue ? JSON.parse(envValue) : undefined,
    };
  },
  {} as Record<EvmChain, unknown>,
);

export async function getEvmAssetsMock(chain: EvmChain) {
  return ENV_ASSETS_MOCK[chain];
}
