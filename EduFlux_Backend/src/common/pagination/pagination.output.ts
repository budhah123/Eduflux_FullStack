import { ApiProperty } from '@nestjs/swagger';

export class IPagination {
  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;
}
