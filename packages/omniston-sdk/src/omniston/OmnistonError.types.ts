export type OmnistonErrorInfo =
  | {
      reason: "QUOTE_VALIDATION_FAILED";
      domain: string;
      metadata:
        | {
            type:
              | "EMULATION_WRONG_OUTPUT_AMOUNT"
              | "EMULATION_WRONG_OUTPUT_WALLET";
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
              | "EMULATION_SWAP_INSUFFICIENT_GAS";
          };
    }
  | {
      reason: "INVALID_ARGUMENT";
      domain: string;
      metadata: {
        argument_name: string;
        actual: string;
        expected: string;
      };
    }
  | {
      reason: "NOT_FOUND";
      domain: string;
      metadata: {
        object_type: string;
        object_id: string;
      };
    }
  | {
      reason: "SWAP_LIMIT_EXCEEDED";
      domain: string;
      metadata: {
        amount: string;
        limit: string;
      };
    }
  | {
      reason: "INTERNAL";
      domain: string;
      metadata: {
        code: string;
        id: string;
      };
    }
  | {
      reason: "INVALID_PARAMETERS" | "UNSUPPORTED";
      domain: string;
      metadata: unknown;
    };

export type OmnistonErrorDetails = {
  error_info?: OmnistonErrorInfo;
} & Record<string, unknown>;
