import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class RequestMagicLinkDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email!: string;
}

export class VerifyMagicLinkDto {
  @ApiProperty()
  @IsString()
  token!: string;
}
