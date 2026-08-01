import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-request';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/invite-member.dto';

@ApiTags('organizations')
@Controller({ path: 'organizations', version: '1' })
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.organizations.listForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrganizationDto) {
    return this.organizations.create(user.id, dto.name);
  }

  @Get(':organizationId/members')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN', 'DEVELOPER', 'FINANCE', 'VIEWER')
  listMembers(@Param('organizationId') organizationId: string) {
    return this.organizations.listMembers(organizationId);
  }

  @Post(':organizationId/invitations')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  invite(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteMemberDto,
  ) {
    return this.organizations.invite(organizationId, user.id, dto.email, dto.role);
  }

  @Post('invitations/accept')
  acceptInvitation(@CurrentUser() user: AuthenticatedUser, @Body() dto: { token: string }) {
    return this.organizations.acceptInvitation(user.id, user.email, dto.token);
  }

  @Patch(':organizationId/members/:memberId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  updateMemberRole(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.organizations.updateMemberRole(organizationId, memberId, dto.role);
  }

  @Delete(':organizationId/members/:memberId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  removeMember(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.organizations.removeMember(organizationId, memberId);
  }
}
