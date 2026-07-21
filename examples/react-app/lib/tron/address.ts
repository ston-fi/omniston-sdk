import { z } from "zod";

export const tronAddressSchema = z
  .string()
  .regex(/^T[a-zA-Z0-9]{33}$/)
  .brand("TronAddress");

export type TronAddress = z.infer<typeof tronAddressSchema>;

export function isTronAddress(src: string): src is TronAddress {
  return tronAddressSchema.safeParse(src).success;
}
