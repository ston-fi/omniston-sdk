import type { OrderSettlementData } from "@ston-fi/omniston-sdk-react";
import { keccak256, sha256 } from "viem";

export function generateHtlcSecret() {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function generateHashlock(
  secret: Uint8Array,
  hashingFunction: OrderSettlementData["htlcHashingFunction"],
) {
  switch (hashingFunction) {
    case "HASHING_FUNCTION_KECCAK256":
      return keccak256(secret, "bytes");
    case "HASHING_FUNCTION_SHA256":
      return sha256(secret, "bytes");
    default:
      throw new Error(`Unsupported hashing function ${hashingFunction}`);
  }
}
