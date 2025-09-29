import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a percentage to a percentage basis point (bps) value.
 */
export function percentToPercentBps(percent: number): number {
  if (percent < 0 || percent > 1) {
    throw new Error("Invalid percent value. Must be between 0 and 1.");
  }

  return percent * 100 * 100;
}

/**
 * Divides a number by a given exponent of base 10 (10exponent), and formats it into a string representation of the number.
 *
 * @see [implementation by viem.](https://github.com/wevm/viem/blob/71a4e7aca259f0565005929d6584dca87bd59807/src/utils/unit/parseUnits.ts#L16)
 */
export function floatToBigNumber(value: string, decimals: number) {
  let [integer = "0", fraction = "0"] = value.split(".");

  const negative = integer.startsWith("-");

  if (negative) integer = integer.slice(1);

  fraction = fraction.padEnd(decimals, "0").slice(0, decimals);

  return BigInt(`${negative ? "-" : ""}${integer}${fraction}`);
}

/**
 * Multiplies a string representation of a number by a given exponent of base 10 (10exponent).
 *
 * @see [implementation by viem.](https://github.com/wevm/viem/blob/71a4e7aca259f0565005929d6584dca87bd59807/src/utils/unit/formatUnits.ts#L16)
 */
export function bigNumberToFloat(value: bigint | string, decimals: number) {
  let display = value.toString();

  const negative = display.startsWith("-");
  if (negative) display = display.slice(1);

  display = display.padStart(decimals, "0");

  // eslint-disable-next-line prefer-const
  let [integer, fraction] = [
    display.slice(0, display.length - decimals),
    display.slice(display.length - decimals),
  ];
  fraction = fraction.replace(/(0+)$/, "");

  return `${negative ? "-" : ""}${integer || "0"}${
    fraction ? `.${fraction}` : ""
  }`;
}

/**
 * Trims a string to keep a specified number of characters at the start and end,
 * replacing the middle section with an ellipsis.
 */
export function trimStringWithEllipsis(
  str: string,
  start: number,
  end?: number,
) {
  if (end === undefined) {
    end = start;
  }

  return `${str.slice(0, start)}…${str.slice(-end)}`;
}

export function retrieveEnvVariable(key: string, defaultValue?: string) {
  const value = process.env[key] ?? defaultValue;

  if (!value) {
    throw new Error(`${key} not configured`);
  }

  return value;
}
