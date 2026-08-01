import { Module } from '@nestjs/common';
import { EscrowsController } from './escrows.controller';
import { EscrowsService } from './escrows.service';

@Module({
  controllers: [EscrowsController],
  providers: [EscrowsService],
})
export class EscrowsModule {}
