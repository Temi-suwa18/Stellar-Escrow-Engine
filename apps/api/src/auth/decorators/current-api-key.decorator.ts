import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthRequest, AuthenticatedApiKey } from '../types/auth-request';

/** Injects the authenticated API key (set by ApiKeyGuard) into a controller method parameter. */
export const CurrentApiKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedApiKey => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    if (!request.apiKey) {
      throw new UnauthorizedException('No authenticated API key on request');
    }
    return request.apiKey;
  },
);
