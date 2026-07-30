import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { AtGuard, CurrentUser } from 'src/auth/decorator';
import { CreateBookmarkInput } from './dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';

@AtGuard()
@ApiBearerAuth('JWT-auth')
@Controller('bookmarks')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) { }


  @Post()
  @ApiOperation({ summary: 'Add a bookmark for a document' })
  @ApiCreatedResponse({ description: 'Bookmark added successfully' })
  async addBookmark(
    @CurrentUser() user: any,
    @Body() createBookmarkInput: CreateBookmarkInput,
  ) {
    const { documentId } = createBookmarkInput;
    return await this.bookmarkService.addBookmark(
      user._id.toString(),
      documentId,
    );
  }

  @Delete(':documentId')
  @ApiOperation({ summary: 'Remove a bookmark for a document' })
  async removeBookmark(
    @CurrentUser() user: any,
    @Param('documentId') documentId: string,
  ) {
    return await this.bookmarkService.removeBookmark(
      user._id.toString(),
      documentId,
    );
  }


  @Get()
  @ApiOperation({ summary: 'Get current user bookmarks' })
  async getUserBookmarks(@CurrentUser() user: any) {
    return this.bookmarkService.getUserBookmarks(user._id.toString());
  }

  @Get('check/:documentId')
  @ApiOperation({ summary: 'Check if a document is bookmarked' })
  async isBookmarked(
    @CurrentUser() user: any,
    @Param('documentId') documentId: string,
  ) {
    return this.bookmarkService.isBookmarked(user._id.toString(), documentId);
  }
}
