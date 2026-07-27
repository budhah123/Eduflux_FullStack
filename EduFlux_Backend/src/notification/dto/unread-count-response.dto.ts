// src/notification/dto/unread-count-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountResponseDto {
  @ApiProperty({ example: 3 })
  count: number;
}
