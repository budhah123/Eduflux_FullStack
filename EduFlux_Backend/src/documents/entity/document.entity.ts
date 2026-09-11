import { ApiProperty } from '@nestjs/swagger';
import { CommonAttribute } from 'src/common/attribute';
import { UserEntity } from 'src/user/entity';
import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';
import { DocumentStatus } from '../enum';

@Entity('documents')
export class DocumentEntity extends CommonAttribute {
  @ApiProperty({
    description: 'The unique identifier of the document',
    type: ObjectId,
    example: '64b8c9f1e4b0a2d3c4e5f678',
  })
  @ObjectIdColumn()
  _id: ObjectId;

  @ApiProperty({
    description: 'The title of the document',
    type: String,
    example: 'Assignment 1',
  })
  @Column('varchar', { name: 'title' })
  title: string;

  @ApiProperty({
    description: 'The description of the document',
    type: String,
    example: 'This is the first assignment.',
  })
  @Column('varchar', { name: 'description', nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Category of the document',
    type: String,
    example: 'notes',
  })
  @Column('varchar', { name: 'category' })
  category: string;

  @ApiProperty({
    description: 'Subject of the docs',
    type: String,
    example: 'Database Management',
  })
  @Column('varchar', { name: 'subject' })
  subject?: string;

  @ApiProperty({
    description: 'Semester of the document',
    type: String,
    example: '6',
  })
  @Column('string', { name: 'semester' })
  semester?: string;

  @ApiProperty({
    description: 'Tags of the document',
    type: [String],
    example: ['DBMS', 'Assignment'],
  })
  @Column('string', { name: 'tags' })
  tags?: string[];

  @ApiProperty({
    description: 'File key of the document',
    type: String,
    example: 'eduflux/docs/user123/file.pdf',
  })
  @Column('string', { name: 'fileKey' })
  fileKey: string;

  @ApiProperty({
    description: 'File url of the document',
    type: String,
    example: 'https://res.cloudinary.com/...',
  })
  @Column('string', { name: 'fileUrl' })
  fileUrl: string;

  @ApiProperty({
    description: 'File format of the document',
    type: String,
    example: 'pdf',
  })
  @Column('string', { name: 'fileFormat', nullable: true })
  fileFormat?: string;

  @ApiProperty({
    description: 'Original filename supplied during upload',
    type: String,
    required: false,
  })
  @Column('string', { name: 'originalFileName', nullable: true })
  originalFileName?: string;

  @ApiProperty({
    description: 'MIME type supplied during upload',
    type: String,
    required: false,
  })
  @Column('string', { name: 'contentType', nullable: true })
  contentType?: string;

  @ApiProperty({
    description: 'File size of the document',
    type: Number,
    example: 1024,
  })
  @Column('number', { name: 'fileSize' })
  fileSize: number;

  @ApiProperty({
    description: 'Number of downloads of the document',
    type: Number,
    example: 10,
  })
  @Column('number', { name: 'downloadCount', default: 0 })
  downloadCount: number = 0;

  @ApiProperty({
    description: 'Status of the files',
    type: String,
    example: DocumentStatus.PENDING,
  })
  @Column('varchar', { name: 'status', default: DocumentStatus.PENDING })
  status: DocumentStatus = DocumentStatus.PENDING;

  @ApiProperty({
    description:
      'Whether this document requires unlock (subscription/upload-credit) or is free for everyone',
    type: Boolean,
    example: true,
    default: true,
  })
  @Column('boolean', { name: 'isPremiumOnly', default: true })
  isPremiumOnly: boolean = true;

  @ApiProperty({
    description: 'User ID of the uploader',
    type: String,
    example: '64b8c9f1e4b0a2d3c4e5f678',
  })
  @Column('varchar', { name: 'userId' })
  userId: string;

  @ApiProperty({
    description:
      "Cloudinary resource_type used at upload ('image' | 'raw' | 'video'). Used to generate correct signed URLs.",
    type: String,
    example: 'raw',
    required: false,
  })
  @Column('string', { name: 'resourceType', nullable: true })
  resourceType?: string;

  @ApiProperty({
    description: 'Cloudinary version of the file',
    type: String,
    example: '1720689402',
    required: false,
  })
  @Column('string', { name: 'fileVersion', nullable: true })
  fileVersion?: string;

  @ApiProperty({
    description:
      'Precomputed thumbnail URL for the document (stored once, not regenerated live).',
    type: String,
    example: 'https://res.cloudinary.com/.../image/upload/...jpg',
    required: false,
  })
  @Column('string', { name: 'thumbnailUrl', nullable: true })
  thumbnailUrl?: string;

  @ApiProperty({
    description:
      'Whether this document is displayed in the homepage showcase (maximum 4 documents)',
    type: Boolean,
    example: false,
    default: false,
  })
  @Column('boolean', { name: 'isHomePage', default: false })
  isHomePage: boolean = false;
}
