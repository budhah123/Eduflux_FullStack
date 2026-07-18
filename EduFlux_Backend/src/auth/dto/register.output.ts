import { ApiProperty } from '@nestjs/swagger';
import { LoginOutput } from './login.output';
import { UserType } from 'src/user/enum';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class RegisterOutput extends LoginOutput {
  @ApiProperty({
    description: 'First name of the user',
    type: String,
    example: 'John',
  })
  firstName?: string;
  @ApiProperty({
    description: 'Last name of the user',
    type: String,
    example: 'Doe',
  })
  lastName?: string;

  @ApiProperty({
    description: 'Indicates whether the user is an institutional user',
    type: Boolean,
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isInstitutional?: boolean = false;

  @ApiProperty({
    description: 'Type of the user',
    type: String,
    example: UserType.USER,
    required: false,
  })
  userType?: UserType;
}
