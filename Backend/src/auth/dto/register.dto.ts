import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'correct horse battery staple 1' })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  @Matches(/\d/, { message: 'password must include at least one number' })
  password!: string;

  @ApiProperty({ example: 'Acme Store' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  organizationName!: string;
}
