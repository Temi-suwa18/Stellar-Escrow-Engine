import { SetMetadata } from '@nestjs/common';
import type { MemberRole } from '@stellar-escrow/database';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to organization members holding one of the given roles.
 * Requires RolesGuard and an organization id resolvable from the request
 * (route param `:organizationId` or an `x-organization-id` header).
 */
export const Roles = (...roles: MemberRole[]) => SetMetadata(ROLES_KEY, roles);
