import { ApiProperty } from '@nestjs/swagger';

export class LoginUserOutput {
  @ApiProperty({
    description: 'User ID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the user',
    type: String,
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Email of the user',
    type: String,
    example: 'john.doe@example.com',
  })
  email?: string;
}

export class LoginOutput {
  @ApiProperty({
    description: 'JWT Access Token',
    type: String,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh Token',
    type: String,
    example: 'dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4uLi4=',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'he user of the user',
    type: LoginUserOutput,
  })
  user?: LoginUserOutput;
}
