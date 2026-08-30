import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';

export class RatingUserOutput {
  @ApiProperty({ type: String, description: 'User ID' })
  _id: ObjectId | string;

  @ApiProperty({ type: String, description: 'User display name' })
  displayName: string;

  @ApiProperty({ type: String, description: 'Avatar URL', required: false })
  avatar?: string;
}

export class RatingOutput {
  @ApiProperty({ type: String, description: 'Rating ID' })
  _id: ObjectId | string;

  @ApiProperty({ type: String, description: 'Document ID' })
  documentId: string;

  @ApiProperty({ type: String, description: 'User ID' })
  userId: string;

  @ApiProperty({ type: Number, description: 'Rating score from 1 to 5' })
  stars: number;

  @ApiProperty({
    type: String,
    description: 'Optional user comment',
    required: false,
  })
  comment?: string;

  @ApiProperty({
    type: RatingUserOutput,
    description: 'Information about the rater',
  })
  user?: RatingUserOutput;

  @ApiProperty({ type: Date, description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ type: Date, description: 'Last update timestamp' })
  updatedAt: Date;
}
