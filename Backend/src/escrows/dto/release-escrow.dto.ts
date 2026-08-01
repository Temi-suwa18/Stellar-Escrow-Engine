import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ReleaseEscrowDto {
  @ApiProperty({
    required: false,
    description:
      'Transaction hash of the on-chain release, if this escrow is registered on the ' +
      'escrow contract. When present, verified against the chain before the escrow is ' +
      'marked RELEASED.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  stellarTxHash?: string;
}
