import { Test, TestingModule } from '@nestjs/testing';
import { BookmarkController } from './bookmark.controller';
import { BookmarkService } from './bookmark.service';

describe('BookmarkController', () => {
  let controller: BookmarkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookmarkController],
      providers: [
        {
          provide: BookmarkService,
          useValue: {
            addBookmark: jest.fn(),
            removeBookmark: jest.fn(),
            getUserBookmarks: jest.fn(),
            isDocumentBookmarked: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BookmarkController>(BookmarkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
