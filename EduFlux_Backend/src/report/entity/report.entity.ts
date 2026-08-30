import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { CommonAttribute } from 'src/common/attribute/common.attribute';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity({ name: 'reports' })
export class ReportEntity extends CommonAttribute {
  @ApiProperty({ description: 'Report identifier', type: String })
  @ObjectIdColumn()
  _id: ObjectId;

  @ApiProperty({ description: 'Document being reported', type: String })
  @Column('varchar', { name: 'documentId' })
  documentId: string;

  @ApiProperty({ description: 'User who filed the report', type: String })
  @Column('varchar', { name: 'reporterId' })
  reporterId: string;

  @ApiProperty({
    description: 'Reason for report',
    type: String,
    enum: ['copyright', 'inappropriate', 'spam', 'wrong_category', 'other'],
  })
  @Column('varchar', { name: 'reason' })
  reason: string;

  @ApiProperty({
    description: 'Optional report details',
    type: String,
    required: false,
  })
  @Column('varchar', { name: 'details', nullable: true })
  details?: string;

  @ApiProperty({
    description: 'Report review status',
    type: String,
    enum: ['pending', 'reviewed', 'dismissed', 'actioned'],
    default: 'pending',
  })
  @Column('varchar', { name: 'status', default: 'pending' })
  status: string;
}
