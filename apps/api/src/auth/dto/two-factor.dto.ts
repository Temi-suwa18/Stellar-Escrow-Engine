import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmTwoFactorDto {
  @ApiProperty({ description: 'Secret returned by POST /auth/2fa/setup' })
  @IsString()
  secret!: string;

  @ApiProperty({ description: '6-digit code from the authenticator app' })
  @IsString()
  token!: string;
}

export class DisableTwoFactorDto {
  @ApiProperty({ description: 'Current password, required to disable 2FA' })
  @IsString()
  password!: string;
}
