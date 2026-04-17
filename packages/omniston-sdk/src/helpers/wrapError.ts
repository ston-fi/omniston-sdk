import { JSONRPCErrorException } from "json-rpc-2.0";

import { ErrorCode } from "../constants";
import { OmnistonError } from "../omniston/OmnistonError";

export function wrapError(error: unknown): OmnistonError {
  if (error instanceof OmnistonError) {
    return error;
  }

  if (error instanceof JSONRPCErrorException) {
    return new OmnistonError(error.code, error.message, {
      cause: error,
      details: error.data,
    });
  }

  if (error instanceof Error) {
    return new OmnistonError(ErrorCode.UNKNOWN, error.message, {
      cause: error,
    });
  }

  return new OmnistonError(ErrorCode.UNKNOWN, String(error));
}

export function wrapErrorsSync<T>(fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    throw wrapError(error);
  }
}

export async function wrapErrorsAsync<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw wrapError(error);
  }
}
