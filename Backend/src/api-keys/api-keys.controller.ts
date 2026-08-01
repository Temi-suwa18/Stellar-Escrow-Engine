import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-request';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@ApiTags('api-keys')
@Controller({ path: 'organizations/:organizationId/api-keys', version: '1' })
@UseGuards(RolesGuard)
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Get()
  @Roles('OWNER', 'ADMIN', 'DEVELOPER', 'FINANCE', 'VIEWER')
  list(@Param('organizationId') organizationId: string) {
    return this.apiKeys.list(organizationId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN', 'DEVELOPER')
  create(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeys.create(organizationId, user.id, dto.name, dto.mode);
  }

  @Delete(':apiKeyId')
  @Roles('OWNER', 'ADMIN', 'DEVELOPER')
  revoke(@Param('organizationId') organizationId: string, @Param('apiKeyId') apiKeyId: string) {
    return this.apiKeys.revoke(organizationId, apiKeyId);
  }
}
