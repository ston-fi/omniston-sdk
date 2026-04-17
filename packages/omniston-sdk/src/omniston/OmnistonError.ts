type GenericError<R extends string, M> = {
  reason: R;
  metadata: M;
  domain: string;
};

type EmptyMetadata = Record<string, never>;

export type OmnistonErrorInfo =
  | GenericError<
      "INVALID_ARGUMENT",
      {
        argument_name: string;
        expected: string;
        actual: string;
      }
    >
  | GenericError<"INVALID_PARAMETERS", EmptyMetadata>
  | GenericError<
      "NOT_FOUND",
      {
        object_type: string;
        object_id: string;
      }
    >
  | GenericError<"UNSUPPORTED", EmptyMetadata>
  | GenericError<
      "SWAP_LIMIT_EXCEEDED",
      {
        amount: string;
        limit: string;
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
          type: "EMULATION_UNSUPPORTED_TOKEN";
          token_address: string;
        }
      | {
          type:
            | "EMULATION_REFUND_SLIPPAGE"
            | "EMULATION_INSUFFICIENT_FUNDS"
            | "EMULATION_SWAP_INSUFFICIENT_GAS";
        }
    >
  | GenericError<"QUOTE_VALIDATOR_ERROR", EmptyMetadata>;

export type OmnistonErrorDetails = {
  error_info?: OmnistonErrorInfo;
} & Record<string, unknown>;

export class OmnistonError extends Error {
  public readonly code: number;
  public readonly details?: OmnistonErrorDetails;

  constructor(
    code: number,
    message: string,
    options?: { details?: OmnistonErrorDetails } & ErrorOptions,
  ) {
    super(message, options);
    this.code = code;
    this.details = options?.details;
    Object.setPrototypeOf(this, OmnistonError.prototype);
  }
}
