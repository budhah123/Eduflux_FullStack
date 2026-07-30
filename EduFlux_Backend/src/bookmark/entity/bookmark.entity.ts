import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { CommonAttribute } from 'src/common/attribute';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity({ name: 'bookmarks' })
export class BookmarkEntity extends CommonAttribute {
  @ApiProperty({
    description: 'The unique identifier of the bookmark',
    type: String,
    example: '64b8f0f2e1d3c2a5f6b7c8d9',
  })
  @ObjectIdColumn()
  _id: ObjectId;

  @ApiProperty({
    description: 'The ID of the user who bookmarked the document',
    type: String,
  })
  @Column('varchar', { name: 'userId' })
  userId: string;

  @ApiProperty({
    description: 'The ID of the bookmarked document',
    type: String,
  })
  @Column('varchar', { name: 'documentId' })
  documentId: string;
}
