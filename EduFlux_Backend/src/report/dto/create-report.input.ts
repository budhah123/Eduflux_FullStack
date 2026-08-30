import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export enum ReportReason {
  COPYRIGHT = 'copyright',
  INAPPROPRIATE = 'inappropriate',
  SPAM = 'spam',
  WRONG_CATEGORY = 'wrong_category',
  OTHER = 'other',
}

export class CreateReportInput {
  @ApiProperty({
    description: 'Document ID being reported',
    example: '64b8c9f1e4b0a2d3c4e5f678',
  })
  @IsString()
  documentId: string;

  @ApiProperty({
    description: 'Reason for the report',
    enum: ReportReason,
    example: ReportReason.INAPPROPRIATE,
  })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiProperty({
    description: 'Optional report details',
    example: 'This file includes copyrighted text from a textbook.',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}
