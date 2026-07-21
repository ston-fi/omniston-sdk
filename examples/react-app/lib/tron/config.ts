import * as z from "zod";

export const tronConfigSchema = z.object({
  network: z.union([z.literal("mainnet"), z.literal("nile")]),
  rpcUrl: z.url(),
  explorerUrl: z.url(),
});

export type TronConfig = z.infer<typeof tronConfigSchema>;
