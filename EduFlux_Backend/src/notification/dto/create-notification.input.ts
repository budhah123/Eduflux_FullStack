// src/notification/dto/create-notification.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { NotificationType } from '../enum';

export class CreateNotificationInput{
  @ApiProperty({ description: 'User ID this notification belongs to', example: '64b7f8c2e1d3c2a5f0a1b2c3' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.DOCUMENT_APPROVED })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'Document Approved' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Your document "Assignment 1" has been approved.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: '/documents/64b8c9f1e4b0a2d3c4e5f678', required: false })
  @IsOptional()
  @IsString()
  link?: string;
}