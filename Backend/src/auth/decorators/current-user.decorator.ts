import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthRequest, AuthenticatedUser } from '../types/auth-request';

/** Injects the authenticated user (set by JwtAuthGuard) into a controller method parameter. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    if (!request.user) {
      throw new UnauthorizedException('No authenticated user on request');
    }
    return request.user;
  },
);
