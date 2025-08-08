import { BuildTransferRequest } from "../api/messages/omni/v1beta7/trader/transaction_builder";
import type { Converter, SetNonNullable, SetOptional } from "../types";

export type TransactionRequest = SetOptional<
  SetNonNullable<
    BuildTransferRequest,
    "sourceAddress" | "destinationAddress" | "quote"
  >,
  "gasExcessAddress" | "refundAddress"
>;

export const TransactionRequest =
  BuildTransferRequest as Converter<TransactionRequest>;
