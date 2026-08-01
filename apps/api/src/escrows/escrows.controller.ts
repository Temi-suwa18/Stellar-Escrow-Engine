import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { EscrowsService } from './escrows.service';
import { Public } from '../auth/decorators/public.decorator';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CurrentApiKey } from '../auth/decorators/current-api-key.decorator';
import type { AuthenticatedApiKey } from '../auth/types/auth-request';
import { CreateEscrowDto } from './dto/create-escrow.dto';
import { FundEscrowDto } from './dto/fund-escrow.dto';
import { DisputeEscrowDto, ResolveDisputeDto } from './dto/dispute-escrow.dto';
import { ListEscrowsDto } from './dto/list-escrows.dto';

/**
 * The core product surface: "apps just call the API." Authenticated with an
 * API key (X-Api-Key), not a dashboard session — the organization is
 * whichever one issued the key, so there's no separate :organizationId in
 * the path.
 */
@ApiTags('escrows')
@ApiSecurity('apiKey')
@Public()
@UseGuards(ApiKeyGuard)
@Controller({ path: 'escrows', version: '1' })
export class EscrowsController {
  constructor(private readonly escrows: EscrowsService) {}

  @Post()
  create(@CurrentApiKey() apiKey: AuthenticatedApiKey, @Body() dto: CreateEscrowDto) {
    return this.escrows.create(apiKey.organizationId, dto);
  }

  @Get()
  list(@CurrentApiKey() apiKey: AuthenticatedApiKey, @Query() query: ListEscrowsDto) {
    return this.escrows.list(apiKey.organizationId, query);
  }

  @Get(':id')
  get(@CurrentApiKey() apiKey: AuthenticatedApiKey, @Param('id') id: string) {
    return this.escrows.get(apiKey.organizationId, id);
  }

  @Post(':id/fund')
  fund(
    @CurrentApiKey() apiKey: AuthenticatedApiKey,
    @Param('id') id: string,
    @Body() dto: FundEscrowDto,
  ) {
    return this.escrows.fund(apiKey.organizationId, id, dto);
  }

  @Post(':id/release')
  release(@CurrentApiKey() apiKey: AuthenticatedApiKey, @Param('id') id: string) {
    return this.escrows.release(apiKey.organizationId, id);
  }

  @Post(':id/milestones/:milestoneId/release')
  releaseMilestone(
    @CurrentApiKey() apiKey: AuthenticatedApiKey,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.escrows.releaseMilestone(apiKey.organizationId, id, milestoneId);
  }

  @Post(':id/refund')
  refund(@CurrentApiKey() apiKey: AuthenticatedApiKey, @Param('id') id: string) {
    return this.escrows.refund(apiKey.organizationId, id);
  }

  @Post(':id/dispute')
  dispute(
    @CurrentApiKey() apiKey: AuthenticatedApiKey,
    @Param('id') id: string,
    @Body() dto: DisputeEscrowDto,
  ) {
    return this.escrows.dispute(apiKey.organizationId, id, dto);
  }

  @Post(':id/resolve')
  resolve(
    @CurrentApiKey() apiKey: AuthenticatedApiKey,
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.escrows.resolve(apiKey.organizationId, id, dto);
  }
}
