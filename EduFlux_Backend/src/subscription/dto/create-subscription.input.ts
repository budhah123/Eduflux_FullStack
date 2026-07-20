// src/subscription/dto/create-subscription.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { PlanType } from '../enum/plan-type.enum';
import { PaymentProvider } from '../enum/payment-provider.enum';


export class CreateSubscriptionInput {
  @ApiProperty({
    description: 'Id of user subscription belongs to',
    example: '64b7f8c2e1d3c2a5f0a1b2c3',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Plan type',
    enum: PlanType,
    example: PlanType.MONTHLY,
    required: false,
  })
  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;

  @ApiProperty({
    description: 'Payment provider',
    enum: PaymentProvider,
    example: PaymentProvider.KHALTI,
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentProvider)
  paymentProvider?: PaymentProvider;

  @ApiProperty({
    description: 'Transaction id from provider',
    example: 'txn_abc123',
    required: false,
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({
    description: 'Expiry date of subscription',
    example: '2026-08-19T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
