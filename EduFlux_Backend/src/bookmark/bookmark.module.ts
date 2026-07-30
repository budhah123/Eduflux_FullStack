import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookmarkService } from './bookmark.service';
import { BookmarkController } from './bookmark.controller';
import { BookmarkEntity } from './entity'; // adjust to your real path
import { DocumentEntity } from 'src/documents';

@Module({
  imports: [TypeOrmModule.forFeature([BookmarkEntity, DocumentEntity])],
  controllers: [BookmarkController],
  providers: [BookmarkService],
  exports: [BookmarkService],
})
export class BookmarkModule {}
