export interface ITimer {
  setTimeout(fn: () => void, timeoutMs: number): Timeout;
  clearTimeout(timeout: Timeout): void;
}

export type Timeout = NodeJS.Timeout | number;
