import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentProvider } from 'src/subscription/enum/payment-provider.enum';
import { PlanType } from 'src/subscription/enum/plan-type.enum';


export class VerifyPaymentDto {
  @ApiProperty({
    description: 'The type of plan for the payment',
    enum: PlanType,
  })
  @IsEnum(PlanType, { message: 'Invalid plan type' })
  planType: PlanType;

  @ApiProperty({
    description: 'The payment provider',
    enum: PaymentProvider,
  })
  @IsEnum(PaymentProvider, { message: 'Invalid payment provider' })
  provider: PaymentProvider;

  @ApiProperty({
    description: 'The amount to be paid',
    type: Number,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Khalti payment index (pidx) for verification',
    required: false,
  })
  @IsOptional()
  @IsString()
  pidx?: string;

  @ApiProperty({
    description: ' Esewa TransactionUuid for verification',
    required: false,
  })
  @IsOptional()
  @IsString()
  transactionUuid?: string;

  @ApiProperty({
    description: 'Product code for the payment',
    required: false,
  })
  @IsOptional()
  @IsString()
  productCode?: string;
}
