import { IPagination } from 'src/common/pagination';
import { NotificationEntity } from '../entity';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationOutput {
  @ApiProperty({
    description: 'List of notifications',
    type: [NotificationEntity],
  })
  data: NotificationEntity[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: IPagination,
  })
  meta: IPagination;
}
