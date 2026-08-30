import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { CommonAttribute } from 'src/common/attribute/common.attribute';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity({ name: 'ratings' })
export class RatingEntity extends CommonAttribute {
  @ApiProperty({ description: 'Rating identifier', type: String })
  @ObjectIdColumn()
  _id: ObjectId;

  @ApiProperty({ description: 'The user who rated the document', type: String })
  @Column('varchar', { name: 'userId' })
  userId: string;

  @ApiProperty({ description: 'The rated document identifier', type: String })
  @Column('varchar', { name: 'documentId' })
  documentId: string;

  @ApiProperty({ description: 'Rating score from 1 to 5', type: Number })
  @Column('number', { name: 'stars' })
  stars: number;

  @ApiProperty({
    description: 'Optional user rating comment',
    type: String,
    required: false,
  })
  @Column('varchar', { name: 'comment', nullable: true })
  comment?: string;
}
