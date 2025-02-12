import { ErrorCode } from "@/constants";
import { OmnistonError } from "@/omniston/OmnistonError";
import { JSONRPCErrorException } from "json-rpc-2.0";

export function wrapError(error: unknown): OmnistonError {
  if (error instanceof OmnistonError) {
    return error;
  }
  if (error instanceof JSONRPCErrorException) {
    return new OmnistonError(error.code, error.message, { cause: error });
  }
  if (error instanceof Error) {
    return new OmnistonError(ErrorCode.UNKNOWN, error.message, {
      cause: error,
    });
  }
  return new OmnistonError(ErrorCode.UNKNOWN, String(error));
}
