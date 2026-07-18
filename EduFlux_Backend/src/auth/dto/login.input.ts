import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginInput {
  @ApiProperty({
    description: 'Email of the user',
    type: String,
    example: 'budhah282@gmail.com',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    type: String,
    example: 'Budhah@456',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
