import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateRatingInput {
  @ApiProperty({
    description: 'Document ID',
    example: '64b8c9f1e4b0a2d3c4e5f678',
  })
  @IsString()
  documentId: string;

  @ApiProperty({ description: 'Rating stars (1-5)', example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  stars: number;

  @ApiProperty({
    description: 'Optional feedback comment',
    example: 'Very helpful summary and examples.',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  comment?: string;
}
