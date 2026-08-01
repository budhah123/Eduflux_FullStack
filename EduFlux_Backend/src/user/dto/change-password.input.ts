import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordInput {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}
