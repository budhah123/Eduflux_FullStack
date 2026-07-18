import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordInput {
  @ApiProperty({
    description: 'The email of the user',
    type: String,
    example: 'budhah282@gmail.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'The reset password token',
    type: String,
    example: '34566',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  token?: string;

  @ApiProperty({
    description: 'The new password for the user',
    type: String,
    example: 'newSecurePassword123',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
