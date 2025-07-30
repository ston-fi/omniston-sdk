import type { JSONRPCError } from "json-rpc-2.0";

export function isJSONRPCError(data: unknown): data is JSONRPCError {
  return Boolean(
    data && typeof data === "object" && "code" in data && "message" in data,
  );
}
