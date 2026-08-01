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
}
