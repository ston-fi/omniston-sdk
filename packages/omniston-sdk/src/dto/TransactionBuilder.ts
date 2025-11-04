import { BuildTransferRequest as ApiBuildTransferRequest } from "../api/messages/omni/v1beta7/trader/transaction_builder";
import type { Converter, SetNonNullable, SetOptional } from "../types";

export type BuildTransferRequest = SetOptional<
  SetNonNullable<
    ApiBuildTransferRequest,
    "sourceAddress" | "destinationAddress" | "quote"
  >,
  "gasExcessAddress" | "refundAddress"
>;

/**
 * @deprecated Use `BuildTransferRequest` instead.
 */
export type TransactionRequest = BuildTransferRequest;

export const BuildTransferRequest =
  ApiBuildTransferRequest as Converter<BuildTransferRequest>;
