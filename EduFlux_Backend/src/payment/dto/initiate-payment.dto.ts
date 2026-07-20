import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { PaymentProvider } from 'src/subscription/enum/payment-provider.enum';
import { PlanType } from 'src/subscription/enum/plan-type.enum';


export class InitiatePaymentDto {
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
}
