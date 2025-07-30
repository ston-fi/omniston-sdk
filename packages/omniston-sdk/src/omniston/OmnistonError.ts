import type { OmnistonErrorDetails } from "./OmnistonError.types";

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
