import { TransactionResponse as ApiTransactionResponse } from "@/api/messages/omni/v1beta4/trader/transaction_builder";
import type { SetNonNullable } from "@/types";

export type TransactionResponse = SetNonNullable<
  ApiTransactionResponse,
  "transaction"
>;

export const TransactionResponse = {
  fromJSON(object: unknown): TransactionResponse {
    const result = ApiTransactionResponse.fromJSON(object);

    for (const message of result.transaction?.ton?.messages ?? []) {
      message.payload = Buffer.from(message.payload, "hex").toString("base64");
    }

    return result as TransactionResponse;
  },

  toJSON(transactionResponse: TransactionResponse): unknown {
    return ApiTransactionResponse.toJSON(transactionResponse);
  },
};
