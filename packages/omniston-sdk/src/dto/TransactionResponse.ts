import { Transaction as ApiTransactionResponse } from "../api/messages/omni/v1beta7/types/transaction";

export type TransactionResponse = ApiTransactionResponse;

export const TransactionResponse = {
  fromJSON(object: unknown): TransactionResponse {
    const result = ApiTransactionResponse.fromJSON(object);

    for (const message of result.ton?.messages ?? []) {
      message.payload = Buffer.from(message.payload, "hex").toString("base64");
      message.jettonWalletStateInit = Buffer.from(
        message.jettonWalletStateInit,
        "hex",
      ).toString("base64");
    }

    return result as TransactionResponse;
  },

  toJSON(transactionResponse: TransactionResponse): unknown {
    return ApiTransactionResponse.toJSON(transactionResponse);
  },
};
