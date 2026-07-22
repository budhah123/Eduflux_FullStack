import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { CommonAttribute } from 'src/common/attribute';
import { UserEntity } from 'src/user/entity';
import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { SubscriptionStatus } from '../enum/subscription-status.enum';
import { PlanType } from '../enum/plan-type.enum';
import { PaymentProvider } from '../enum/payment-provider.enum';

@Entity('subscriptions')
export class SubscriptionEntity extends CommonAttribute {
  @ApiProperty({
    description: 'Unique identifier for the subscription',
    type: String,
    example: '64b7f8c2e1d3c2a5f0a1b2c3',
  })
  @ObjectIdColumn()
  _id: ObjectId;

  @ApiProperty({
    description: 'Reference to user who owns this subscription',
    type: String,
    example: '64b7f8c2e1d3c2a5f0a1b2c3',
  })
  @Column('varchar', { name: 'userId' })
  userId: string;

  user?: UserEntity;

  @ApiProperty({
    description: 'Current status of subscription',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.INACTIVE,
  })
  @Column('varchar', { name: 'status', default: SubscriptionStatus.INACTIVE })
  status: SubscriptionStatus = SubscriptionStatus.INACTIVE;

  @ApiProperty({
    description: 'Plan type of subscription',
    enum: PlanType,
    example: PlanType.MONTHLY,
    required: false,
  })
  @Column('varchar', { name: 'planType', nullable: true })
  planType?: PlanType;

  @ApiProperty({
    description: 'Expiry date of subscription',
    type: Date,
    example: '2026-08-19T00:00:00.000Z',
    required: false,
  })
  @Column('timestamp', { name: 'expiryDate', nullable: true })
  expiryDate?: Date;

  @ApiProperty({
    description: 'Payment provider used',
    enum: PaymentProvider,
    example: PaymentProvider.KHALTI,
    required: false,
  })
  @Column('varchar', { name: 'paymentProvider', nullable: true })
  paymentProvider?: PaymentProvider;

  @ApiProperty({
    description: 'Transaction id from payment provider',
    type: String,
    example: 'txn_abc123',
    required: false,
  })
  @Column('varchar', { name: 'transactionId', nullable: true })
  transactionId?: string;
}
