import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { CommonAttribute } from 'src/common/attribute';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity('document_chunks')
export class DocumentChunkEntity extends CommonAttribute {
  @ApiProperty({
    description: 'Unique identifier for the chunk',
    type: String,
    example: '64b7f8c2e1d3c2a5f0a1b2c3',
  })
  @ObjectIdColumn()
  _id: ObjectId;

  @ApiProperty({
    description: 'ID of the parent document this chunk belongs to',
    type: String,
    example: '64b8c9f1e4b0a2d3c4e5f678',
  })
  @Column('varchar', { name: 'documentId' })
  documentId: string;

  @ApiProperty({
    description: 'Extracted text content of this chunk',
    type: String,
    example: 'Chapter 2 discusses dynamic programming techniques...',
  })
  @Column('varchar', { name: 'content' })
  content: string;

  @ApiProperty({
    description: 'Order/index of this chunk within the document',
    type: Number,
    example: 0,
  })
  @Column('int', { name: 'chunkIndex' })
  chunkIndex: number;

  @ApiProperty({
    description: 'Embedding vector representing this chunk semantically',
    type: [Number],
  })
  @Column('json', { name: 'embedding', nullable: true })
  embedding: number[];
}
