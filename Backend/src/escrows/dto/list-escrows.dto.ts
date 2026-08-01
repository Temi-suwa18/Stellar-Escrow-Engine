import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EscrowCategory, EscrowStatus } from '@stellar-escrow/database';

export class ListEscrowsDto {
  @ApiProperty({ enum: EscrowStatus, required: false })
  @IsOptional()
  @IsEnum(EscrowStatus)
  status?: EscrowStatus;

  @ApiProperty({ enum: EscrowCategory, required: false })
  @IsOptional()
  @IsEnum(EscrowCategory)
  category?: EscrowCategory;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
