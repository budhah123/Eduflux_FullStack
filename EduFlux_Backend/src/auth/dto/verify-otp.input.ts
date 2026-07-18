import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { AuthType } from '../enum/auth-type.enum';
import { AuthTokenType } from '../enum';

export class VerifyOtpInput {
  @ApiProperty({
    description: 'Email address of the user',
    type: String,
    example: 'john.doe@example.com',
  })
  @IsString()
  email: string;
  @ApiProperty({
    description: 'OTP code',
    type: String,
    example: '123456',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Authentication type',
    enum: AuthTokenType,
  })
  @IsEnum(AuthTokenType)
  authTokenType: AuthTokenType;
}
