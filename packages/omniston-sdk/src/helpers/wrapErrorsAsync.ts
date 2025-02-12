import { wrapError } from "@/helpers/wrapError";

export async function wrapErrorsAsync<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw wrapError(error);
  }
}
