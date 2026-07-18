import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CheckUserInput {
  @ApiProperty({
    description: 'The email of the user',
    type: String,
    example: 'john.doe@example.com',
  })
  @IsString()
  email: string;
}
