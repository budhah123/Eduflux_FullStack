import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdatePasswordInput {
  @ApiProperty({
    description: 'Current password of the user',
    type: String,
    example: 'OldPassword@123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password of the user',
    type: String,
    example: 'NewPassword@123',
  })
  @IsString()
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password of the user',
    type: String,
    example: 'NewPassword@123',
  })
  @IsString()
  confirmNewPassword: string;
}
