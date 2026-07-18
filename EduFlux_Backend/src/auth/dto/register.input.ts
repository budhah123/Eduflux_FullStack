import { ApiProperty } from '@nestjs/swagger';
import { LoginInput } from './login.input';
import { IsOptional, IsString } from 'class-validator';

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
}
