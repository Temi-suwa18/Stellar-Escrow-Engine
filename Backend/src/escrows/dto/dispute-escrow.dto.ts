import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DisputeEscrowDto {
  @ApiProperty({ example: 'Delivered item did not match description' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reason!: string;
}

export enum DisputeOutcome {
  RELEASE = 'RELEASE',
  REFUND = 'REFUND',
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: DisputeOutcome })
  @IsEnum(DisputeOutcome)
  outcome!: DisputeOutcome;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @ApiProperty({
    required: false,
    description:
      'Transaction hash of the arbiter calling `resolve` on-chain, if this escrow is ' +
      'registered on the escrow contract. When present, verified against the chain.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  stellarTxHash?: string;
}
