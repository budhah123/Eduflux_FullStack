import { ApiProperty } from '@nestjs/swagger';
import { BookmarkEntity } from '../entity';
import { IPagination } from 'src/common/pagination';

export class BookmarkOutput {
  @ApiProperty({ description: 'List of Bookmarks', type: [BookmarkEntity] })
  data: BookmarkEntity[];

  @ApiProperty({ description: 'Pagination metadata', type: IPagination })
  meta: IPagination;
}
