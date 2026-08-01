import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { MemberRole } from '@stellar-escrow/database';
import { PrismaService } from '../../database/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthRequest } from '../types/auth-request';

/**
 * Enforces organization-scoped RBAC. Resolves the target organization from
 * the route param `:organizationId` (falling back to an `x-organization-id`
 * header for routes that don't put it in the path), then requires the
 * caller to be a member of that organization holding one of the roles
 * declared via `@Roles(...)`. Must run after JwtAuthGuard.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const organizationId =
      (request.params?.organizationId as string | undefined) ??
      (request.headers['x-organization-id'] as string | undefined);

    if (!organizationId) {
      throw new ForbiddenException('No organization specified for this request');
    }

    const membership = await this.prisma.client.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: request.user.id } },
    });

    if (!membership || !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient role for this organization');
    }

    return true;
  }
}
