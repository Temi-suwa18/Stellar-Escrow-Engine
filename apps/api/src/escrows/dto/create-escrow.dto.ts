import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { EscrowCategory } from '@stellar-escrow/database';
import { IsStellarAddress } from '../../common/is-stellar-address.decorator';

export class CreateMilestoneDto {
  @ApiProperty({ example: 'Design draft' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description!: string;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @IsPositive()
  amount!: number;
}

export class CreateEscrowDto {
  @ApiProperty({ enum: EscrowCategory, example: EscrowCategory.FREELANCE })
  @IsEnum(EscrowCategory)
  category!: EscrowCategory;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ example: 'USDC' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  asset!: string;

  @ApiProperty({ description: 'Stellar public key funding the escrow' })
  @IsStellarAddress()
  depositorWallet!: string;

  @ApiProperty({ description: 'Stellar public key receiving released funds' })
  @IsStellarAddress()
  beneficiaryWallet!: string;

  @ApiProperty({ required: false, description: 'Required to open a dispute on this escrow' })
  @IsOptional()
  @IsStellarAddress()
  arbitratorWallet?: string;

  @ApiProperty({ type: [CreateMilestoneDto], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateMilestoneDto)
  milestones?: CreateMilestoneDto[];

  @ApiProperty({ required: false, description: 'Rental/logistics style — lock until this date' })
  @IsOptional()
  @IsDateString()
  timeLockUntil?: string;

  @ApiProperty({ required: false, description: 'Ecommerce style — auto-release if untouched' })
  @IsOptional()
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(365)
  autoReleaseAfterDays?: number;
}
