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

/**
 * Converts a hexadecimal string to a Base64-encoded string.
 */
export function hexToBase64(hex: string) {
  return Buffer.from(hex, "hex").toString("base64");
}
