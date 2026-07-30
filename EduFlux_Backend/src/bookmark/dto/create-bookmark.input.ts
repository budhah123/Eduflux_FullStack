import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBookmarkInput {
  @ApiProperty({
    description: 'The ID of the document to bookmark',
    type: String,
    example: '64b8f0f2e1d3c2a5f6b7c8d9',
  })
  @IsNotEmpty()
  @IsString()
  documentId: string;
}
