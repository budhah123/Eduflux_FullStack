import { ApiProperty } from '@nestjs/swagger';
import { LoginInput } from './login.input';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserType } from 'src/user/enum';

export class RegisterInput extends LoginInput {
  @ApiProperty({
    description: 'First name of the user',
    type: String,
    example: 'John',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the user',
    type: String,
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Type of the user',
    type: String,
    example: UserType.USER,
    required: false,
  })
  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType = UserType.USER;
}
