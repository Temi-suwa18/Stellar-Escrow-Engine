export type EscrowErrorType =
  | 'invalid_request_error'
  | 'api_error'
  | 'authentication_error'
  | 'rate_limit_error';

/**
 * Thrown for any non-2xx response. Mirrors the Stripe-style error envelope
 * the API always returns: `{ error: { type, code, message, requestId } }`.
 */
export class EscrowApiError extends Error {
  readonly status: number;
  readonly type: EscrowErrorType | undefined;
  readonly code: string | undefined;
  readonly requestId: string | undefined;

  constructor(
    message: string,
    status: number,
    options: { type?: EscrowErrorType; code?: string; requestId?: string } = {},
  ) {
    super(message);
    this.name = 'EscrowApiError';
    this.status = status;
    this.type = options.type;
    this.code = options.code;
    this.requestId = options.requestId;
  }
}
