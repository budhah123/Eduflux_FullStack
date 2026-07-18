import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManualVerifyInput {
  @ApiProperty({
    description: 'Payment ID to manually verify',
    type: String,
    example: '67b9f1234567890abcdef123',
  })
  @IsNotEmpty()
  @IsString()
  paymentId: string;
}
