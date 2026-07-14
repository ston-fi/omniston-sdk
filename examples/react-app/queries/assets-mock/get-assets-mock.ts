"use server";

import type { Chain } from "~/models/chain";

export async function getAssetsMock(chain: Chain) {
  const envKey = `OMNIDEMO__ASSETS_MOCK__${chain.toUpperCase()}`;
  const envValue = process.env[envKey];

  return envValue ? JSON.parse(envValue) : undefined;
}
