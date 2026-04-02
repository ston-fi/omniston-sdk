type GenericError<R extends string, M> = {
  reason: R;
  metadata: M;
  domain: string;
};

export type OmnistonErrorInfo =
  | GenericError<
      "INVALID_ARGUMENT",
      {
        argument_name: string;
        expected: string;
        actual: string;
      }
    >
  | GenericError<"INVALID_PARAMETERS", unknown>
  | GenericError<
      "NOT_FOUND",
      {
        object_type: string;
        object_id: string;
      }
    >
  | GenericError<"UNSUPPORTED", unknown>
  | GenericError<
      "SWAP_LIMIT_EXCEEDED",
      {
        amount: string;
        limit: string;
      }
    >
  | GenericError<
      "INTERNAL",
      {
        code: string;
        id: string;
      }
    >
  | GenericError<
      "QUOTE_VALIDATION_FAILED",
      | {
          type: "EMULATION_WRONG_OUTPUT_AMOUNT";
          expected: string;
          actual: string;
        }
      | {
          type: "EMULATION_WRONG_OUTPUT_WALLET";
          expected: string;
          actual: string;
        }
      | {
          type: "EMULATION_SWAP_FAILED";
          protocol: string;
          status: string;
        }
      | {
          type:
            | "EMULATION_REFUND_SLIPPAGE"
            | "EMULATION_INSUFFICIENT_FUNDS"
            | "EMULATION_UNSUPPORTED_TOKEN"
            | "EMULATION_SWAP_INSUFFICIENT_GAS";
        }
    >
  | GenericError<"QUOTE_VALIDATOR_ERROR", unknown>;
