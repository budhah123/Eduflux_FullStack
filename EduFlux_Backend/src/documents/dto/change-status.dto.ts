// src/documents/dto/change-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DocumentStatus } from '../enum';

export class ChangeStatusDto {
  @ApiProperty({
    description: 'New status for the document',
    enum: DocumentStatus,
    example: DocumentStatus.APPROVED,
  })
  @IsEnum(DocumentStatus)
  status: DocumentStatus;
}
