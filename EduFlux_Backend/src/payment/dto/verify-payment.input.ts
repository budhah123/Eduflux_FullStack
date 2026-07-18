import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '../enum';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentInput {
  @ApiProperty({
    description: 'Payment method used for the transaction',
    example: 'ESWEA',
    enum: PaymentMethod,
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    description: 'Unique identifier for the payment to be verified',
    type: String,
    example: '60c72b2f9b1e8e5d6c8f9a3b',
  })
  @IsNotEmpty()
  @IsString()
  paymentId: string;

  @ApiProperty({
    description:
      'Additional data required for payment verification (e.g., transaction ID for ESWEA )',
    type: String,
    example: 'abc123xyz', // For ESWEA
  })
  @IsOptional()
  @IsString()
  data?: string; //esewa

  @ApiProperty({
    description:
      'Khalti payment ID required for payment verification (if method is KHALTI)',
    type: String,
    example: 'khalti12345', // For Khalti
  })
  @IsOptional()
  @IsString()
  pidx?: string; //khalti
}
