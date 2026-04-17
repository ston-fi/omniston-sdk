import { z } from "zod";

export const tonAddressSchema = z
  .string()
  .regex(/(^((EQ|UQ)[a-zA-Z0-9-_]{46})$)|(^((-1|0):[a-zA-Z0-9]{64})$)/)
  .brand("TonAddress");

export type TonAddress = z.infer<typeof tonAddressSchema>;

export function isTonAddress(src: string): src is TonAddress {
  return tonAddressSchema.safeParse(src).success;
}
