import { IPagination } from 'src/common/pagination';
import { UserEntity } from '../entity';
import { ApiProperty } from '@nestjs/swagger';

export class UserOutput {
  @ApiProperty({ description: 'List of users', type: [UserEntity] })
  data: UserEntity[];

  @ApiProperty({ description: 'Pagination metadata', type: IPagination })
  meta: IPagination;
}
