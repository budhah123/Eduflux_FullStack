import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { CommonAttribute } from 'src/common/attribute';
import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { NotificationType } from '../enum';

@Entity({ name: 'notifications' })
export class NotificationEntity extends CommonAttribute {
  @ApiProperty({ example: '64b7f8c2e1d3c2a5f0a1b2c3' })
  @ObjectIdColumn()
  _id: ObjectId;

  @ApiProperty({ description: 'User this notification belongs to' })
  @Column('varchar', { name: 'userId' })
  userId: string;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.DOCUMENT_APPROVED,
  })
  @Column('varchar', { name: 'type' })
  type: NotificationType;

  @ApiProperty({ example: 'Your document was approved' })
  @Column('varchar', { name: 'title' })
  title: string;

  @ApiProperty({
    example: 'Assignment 1.pdf has been approved and is now live.',
  })
  @Column('varchar', { name: 'message' })
  message: string;

  @ApiProperty({ example: false })
  @Column('boolean', { name: 'isRead', default: false })
  isRead: boolean = false;

  @ApiProperty({
    required: false,
    description: 'Optional link, e.g. document id or subscription page',
  })
  @Column('varchar', { name: 'link', nullable: true })
  link?: string;
}
