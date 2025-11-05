import {
  EscrowOrderData as ApiEscrowOrderData,
  EscrowOrderList as ApiEscrowOrderList,
  EscrowOrderListRequest as ApiEscrowOrderListRequest,
} from "../api/messages/omni/v1beta7/trader/escrow";
import type { Converter, SetNonNullable } from "../types";
import type { Quote } from "./Quote";

export type EscrowOrderListRequest = SetNonNullable<
  ApiEscrowOrderListRequest,
  "traderWalletAddress"
>;

export const EscrowOrderListRequest =
  ApiEscrowOrderListRequest as Converter<EscrowOrderListRequest>;

export type EscrowOrderData = Omit<
  SetNonNullable<ApiEscrowOrderData, "escrowItemAddress">,
  "quote"
> & {
  quote: Quote;
};

export const EscrowOrderData = ApiEscrowOrderData as Converter<EscrowOrderData>;

export type EscrowOrderListResponse = {
  orders: EscrowOrderData[];
};

export const EscrowOrderListResponse =
  ApiEscrowOrderList as Converter<EscrowOrderListResponse>;
