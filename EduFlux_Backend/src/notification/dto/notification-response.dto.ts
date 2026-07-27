// src/notification/dto/notification-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../enum';

export class NotificationResponseDto {
  @ApiProperty({ example: '64b7f8c2e1d3c2a5f0a1b2c3' })
  _id: string;

  @ApiProperty({ example: '64b7f8c2e1d3c2a5f0a1b2c3' })
  userId: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ example: 'Document Approved' })
  title: string;

  @ApiProperty({ example: 'Your document has been approved.' })
  message: string;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({
    example: '/documents/64b8c9f1e4b0a2d3c4e5f678',
    required: false,
  })
  link?: string;

  @ApiProperty({ example: '2026-07-27T10:00:00.000Z' })
  createdAt: Date;
}
