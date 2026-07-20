// src/subscription/dto/update-subscription.dto.ts
import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateSubscriptionInput } from './create-subscription.input';
import { SubscriptionStatus } from '../enum/subscription-status.enum';

export class UpdateSubscriptionInput extends PartialType(
  CreateSubscriptionInput,
) {
  @ApiProperty({
    description: 'Status of subscription',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}
