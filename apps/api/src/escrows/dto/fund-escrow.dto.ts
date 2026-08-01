import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class FundEscrowDto {
  @ApiProperty({ description: 'Transaction hash of the on-chain funding transaction' })
  @IsString()
  @MinLength(1)
  stellarTxHash!: string;

  @ApiProperty({ required: false, description: 'Soroban contract address once deployed' })
  @IsOptional()
  @IsString()
  contractAddress?: string;
}
