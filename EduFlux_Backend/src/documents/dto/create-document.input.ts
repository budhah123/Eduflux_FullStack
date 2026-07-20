import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDocumentInput {
  @ApiProperty({
    description: 'Title of the document',
    type: String,
    example: 'Assignment 1',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the document',
    type: String,
    example: 'This is the first assignment.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category of the document',
    type: String,
    example: 'Assignment',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Department of the document',
    type: String,
    example: 'Computer Science',
  })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({
    description: 'Semester of the document',
    type: String,
    example: 'First Semester',
  })
  @IsString()
  @IsOptional()
  semester?: string;

  @ApiPropertyOptional({
    description: 'Tags of the document',
    type: [String],
    example: ['Assignment', 'First Semester'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return value;
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return value;
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'File format of the document',
    type: String,
    example: 'pdf',
  })
  @IsString()
  @IsOptional()
  fileFormat?: string;

  // create-document.input.ts (add this field)
  @ApiProperty({
    description: 'Whether this document requires unlock',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPremiumOnly?: boolean;
}
