import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiKeyMode } from '@stellar-commerce/database';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Backend server key' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: ApiKeyMode, example: ApiKeyMode.TEST })
  @IsEnum(ApiKeyMode)
  mode!: ApiKeyMode;
}
