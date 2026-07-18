import { ApiProperty } from '@nestjs/swagger';

export class TokenOutput {
  @ApiProperty({
    description: 'JWT Access Token',
    type: String,
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh Token',
    type: String,
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token type',
    type: String,
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    type: Number,
    example: 3600,
  })
  expiresIn: number;
}
