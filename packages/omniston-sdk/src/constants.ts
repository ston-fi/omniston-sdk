export * from "./api/constants";

export const SettlementMethod = {
  SWAP: "swap",
  ORDER: "order",
} as const;

export type SettlementMethod = (typeof SettlementMethod)[keyof typeof SettlementMethod];

export const ErrorCode = {
  /**
   * The omniston-api use numeric error codes.
   * The -1 code is reserved for unknown errors,
   * which means that the error code is not recognized or defined in the API documentation.
   */
  UNKNOWN: -1,
} as const;
