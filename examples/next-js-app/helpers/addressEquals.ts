import type { Address } from "@ston-fi/omniston-sdk-react";

export function addressEquals(
  a: Address | null | undefined,
  b: Address | null | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.blockchain === b.blockchain && a.address === b.address;
}
