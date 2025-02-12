import { wrapError } from "@/helpers/wrapError";

export function wrapErrorsSync<T>(fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    throw wrapError(error);
  }
}
