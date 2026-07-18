import { CommonAttribute } from 'src/common/attribute';
import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';
import { PaymentMethod, PaymentStatus } from '../enum';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from 'src/user/entity';
import { DocumentEntity } from 'src/documents';

@Entity({ name: 'payments' })
export class PaymentEntity extends CommonAttribute {
  @ApiProperty({
    description: 'Unique identifier for the payment',
    type: String,
    example: '60c72b2f9b1e8e5d6c8f9a3b',
  })
  @ObjectIdColumn()
  _id: ObjectId;

  @ApiProperty({
    description: 'Amount paid for the booking',
    type: Number,
    example: 150.75,
  })
  @Column('number', { name: 'amount' })
  amount: number;

  @ApiProperty({
    description: 'Payment method used for the transaction',
    example: 'ESWEA',
  })
  @Column('varchar', { name: 'method' })
  method: PaymentMethod;

  @ApiProperty({
    description: 'Transaction ID for the payment (if applicable)',
    type: String,
    example: 'abc123xyz',
  })
  @Column('varchar', { name: 'transaction_id', nullable: true })
  transactionUuid?: string; // esewa

  @ApiProperty({
    description: 'Khalti payment ID (if applicable)',
    type: String,
    example: 'khalti12345',
  })
  @Column('varchar', { name: 'khalti_pidix', nullable: true })
  khaltiPidix: string; // khalti

  @ApiProperty({
    description: 'Current status of the payment',
    example: 'PENDING',
  })
  @Column('varchar', { name: 'paymentStatus' })
  paymentStatus: PaymentStatus; // pending, completed, failed

  @ApiProperty({
    description: 'User associated with the payment',
    type: () => UserEntity,
  })
  @Column('json', { name: 'user' })
  user: UserEntity;

  @ApiProperty({
    description: 'The assignment purchased by the user',
    type: () => DocumentEntity,
  })
  @Column('json', { name: 'assignment' })
  assignment: DocumentEntity;
}
