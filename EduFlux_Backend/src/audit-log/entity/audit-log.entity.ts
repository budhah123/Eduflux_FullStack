import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { CommonAttribute } from 'src/common/attribute/common.attribute';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLogEntity extends CommonAttribute {
  @ApiProperty({ description: 'Audit log identifier' })
  @ObjectIdColumn()
  _id: ObjectId;

  @ApiProperty({
    description: 'Admin user responsible for the action',
    required: false,
  })
  @Column('varchar', { name: 'adminUserId', nullable: true })
  adminUserId?: string;

  @ApiProperty({
    description: 'Admin action type',
    example: 'approved_document',
  })
  @Column('varchar', { name: 'action' })
  action: string;

  @ApiProperty({ description: 'Type of resource affected', required: false })
  @Column('varchar', { name: 'targetType', nullable: true })
  targetType?: string;

  @ApiProperty({ description: 'ID of the resource affected', required: false })
  @Column('varchar', { name: 'targetId', nullable: true })
  targetId?: string;

  @ApiProperty({
    description: 'Friendly name of the resource affected',
    required: false,
  })
  @Column('varchar', { name: 'targetName', nullable: true })
  targetName?: string;

  @ApiProperty({ description: 'Action details', required: false })
  @Column('varchar', { name: 'details', nullable: true })
  details?: string;

  @ApiProperty({ description: 'Audit timestamp', type: Date })
  @Column('timestamp', {
    name: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  timestamp: Date;
}
