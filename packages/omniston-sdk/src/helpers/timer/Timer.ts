import type { ITimer, Timeout } from "./Timer.types";

/**
 * Encapsulate setTimeout method to allow overriding it in test code.
 */
export class Timer implements ITimer {
  setTimeout(fn: () => void, timeoutMs: number): Timeout {
    return setTimeout(fn, timeoutMs);
  }

  clearTimeout(timeout: Timeout): void {
    clearTimeout(timeout);
  }
}
