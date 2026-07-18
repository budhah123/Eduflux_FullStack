import { ApiProperty } from '@nestjs/swagger';
import { LoginOutput } from './login.output';

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
}
