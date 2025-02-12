export class OmnistonError extends Error {
  public readonly code: number;

  constructor(code: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.code = code;
    Object.setPrototypeOf(this, OmnistonError.prototype);
  }
}
