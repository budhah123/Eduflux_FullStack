import { IsNotEmpty, IsString } from 'class-validator';
import { PaymentMethod } from '../enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutInput {
  @ApiProperty({
    description: 'Amount paid for the booking',
    type: Number,
    example: 150.75,
  })
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Payment method used for the transaction',
    example: 'ESWEA',
  })
  @IsString()
  method: PaymentMethod;

  @ApiProperty({
    description: 'Assignment ID associated with the payment',
    type: String,
    example: '60c72b2f9b1e8e5d6c8f9a3b',
  })
  @IsNotEmpty()
  @IsString()
  assignmentId: string;
}
