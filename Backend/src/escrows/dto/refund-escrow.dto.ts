import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefundEscrowDto {
  @ApiProperty({
    required: false,
    description:
      'Transaction hash of the on-chain refund, if this escrow is registered on the ' +
      'escrow contract. When present, verified against the chain before the escrow is ' +
      'marked REFUNDED.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  stellarTxHash?: string;
}
