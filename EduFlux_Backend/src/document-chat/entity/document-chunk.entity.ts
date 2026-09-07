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
    description: 'Embedding vector representing this chunk semantically',
    type: [Number],
  })
  @Column('json', { name: 'embedding', nullable: true })
  embedding: number[];

  @Column('int', { name: 'chunkIndex' })
  chunkIndex: number;

  @ApiProperty({
    description:
      'Nearest preceding section heading detected for this chunk, used to anchor retrieval context',
    type: String,
    required: false,
  })
  @Column('varchar', { name: 'sectionHeading', nullable: true })
  sectionHeading?: string;

  @ApiProperty({
    description:
      'Embedding vector of just the sectionHeading text, used to semantically match a question against ANY heading wording, not a fixed word list',
    type: [Number],
    required: false,
  })
  @Column('json', { name: 'headingEmbedding', nullable: true })
  headingEmbedding?: number[];

  @ApiProperty({
    description:
      'Version of the chunking algorithm used to produce this chunk, used to detect and invalidate stale chunks after a chunking-logic upgrade',
    type: Number,
  })
  @Column('int', { name: 'chunkVersion', default: 1 })
  chunkVersion: number;
}
