import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionEntity } from '../entity';
import { IPagination } from 'src/common/pagination';

export class SubscriptionOutput {
  @ApiProperty({
    description: 'List of subscriptions',
    type: [SubscriptionEntity],
  })
  data: SubscriptionEntity[];

  @ApiProperty({ description: 'Pagination metadata', type: IPagination })
  meta: IPagination;
}
