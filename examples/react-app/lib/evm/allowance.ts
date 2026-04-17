import { maxUint256 } from "viem";

export const INFINITE_ALLOWANCE_THRESHOLD = maxUint256 / 2n;
// treat anything over half of maxUint256 as "infinite" — some tokens skip allowance deduction at this threshold

export const isAllowanceInfinite = (allowance: bigint | undefined) =>
  allowance !== undefined && allowance > INFINITE_ALLOWANCE_THRESHOLD;
