import { z } from "zod";

export const erc20AddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .brand("Erc20Address");

export type Erc20Address = z.infer<typeof erc20AddressSchema>;

export function isErc20Address(src: string): src is Erc20Address {
  return erc20AddressSchema.safeParse(src).success;
}
