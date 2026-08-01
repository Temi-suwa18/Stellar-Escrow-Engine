import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison --
   HttpStatus is a numeric enum; comparing plain response-status numbers
   against it (>=500, ===401, ...) is the standard Nest idiom and safe here. */

interface StripeStyleError {
  error: {
    type: 'invalid_request_error' | 'api_error' | 'authentication_error' | 'rate_limit_error';
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
}

function errorTypeForStatus(status: number): StripeStyleError['error']['type'] {
  if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
    return 'authentication_error';
  }
  if (status === HttpStatus.TOO_MANY_REQUESTS) {
    return 'rate_limit_error';
  }
  if (status >= 500) {
    return 'api_error';
  }
  return 'invalid_request_error';
}

/**
 * Normalizes every thrown error — HttpException or otherwise — into a single
 * Stripe-style envelope so API consumers never have to branch on response
 * shape. Unrecognized errors are logged with full detail server-side but
 * never leak internals (stack traces, DB errors) to the client.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request.headers['x-request-id'] as string | undefined) ?? 'unknown';

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage = this.extractMessage(exception);
    const code = this.extractCode(exception, status);
    const details = this.extractDetails(exception);

    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} -> ${status}: ${rawMessage}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${requestId}] ${request.method} ${request.url} -> ${status}: ${rawMessage}`,
      );
    }

    const body: StripeStyleError = {
      error: {
        type: errorTypeForStatus(status),
        code,
        message:
          status >= 500 ? 'An internal error occurred. Our team has been notified.' : rawMessage,
        requestId,
        ...(details ? { details } : {}),
      },
    };

    response.status(status).json(body);
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') return response;
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const { message } = response;
        return Array.isArray(message) ? message.join('; ') : String(message);
      }
      return exception.message;
    }
    if (exception instanceof Error) return exception.message;
    return 'Unknown error';
  }

  private extractCode(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null && 'code' in response) {
        return String(response.code);
      }
      return exception.constructor.name.replace(/Exception$/, '').toLowerCase() || `http_${status}`;
    }
    return 'internal_error';
  }

  private extractDetails(exception: unknown): unknown {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const { message } = response;
        if (Array.isArray(message)) return message;
      }
    }
    return undefined;
  }
}
