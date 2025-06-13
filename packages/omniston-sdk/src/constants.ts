export { SettlementMethod } from "./api/messages/omni/v1beta7/types/common";
export { GaslessSettlement } from "./api/messages/omni/v1beta7/types/quote";

export enum Blockchain {
  UNKNOWN_BLOCKCHAIN = 0,
  TRON = 195,
  TON = 607,
  UNRECOGNIZED = -1,
}

export enum ErrorCode {
  UNKNOWN = -1,
}
