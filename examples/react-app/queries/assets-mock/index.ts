import type { z } from "zod";

import type { Chain } from "@/models/chain";

import { getAssetsMock } from "./get-assets-mock";

export async function resolveAssetsMock<T>(chain: Chain, fallback: unknown, schema: z.ZodType<T>) {
  const envOverride = await getAssetsMock(chain);
  const mock = envOverride ?? fallback;

  return schema.array().parse(mock);
}
