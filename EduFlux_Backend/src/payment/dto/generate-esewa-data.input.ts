import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateEsewaDataInput {
  @ApiProperty({
    description: 'Payment ID to generate test data for',
    type: String,
    example: '67b9f1234567890abcdef123',
  })
  @IsNotEmpty()
  @IsString()
  paymentId: string;

  @ApiProperty({
    description:
      'Transaction code from eSewa (optional, will use default for testing)',
    type: String,
    example: '0007KNH',
    required: false,
  })
  @IsOptional()
  @IsString()
  transactionCode?: string;

  @ApiProperty({
    description: 'Payment status (optional, defaults to COMPLETE)',
    type: String,
    example: 'COMPLETE',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;
}
