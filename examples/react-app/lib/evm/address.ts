import { z } from "zod";
import type { Address as ViemAddres } from "viem";

export const erc20AddressSchema = z
  .custom<ViemAddres>((value) => typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value))
  .brand("Erc20Address");

export type Erc20Address = z.infer<typeof erc20AddressSchema>;

export function isErc20Address(src: string): src is Erc20Address {
  return erc20AddressSchema.safeParse(src).success;
}
