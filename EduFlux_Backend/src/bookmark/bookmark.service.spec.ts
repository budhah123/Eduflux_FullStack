import { Test, TestingModule } from '@nestjs/testing';
import { BookmarkService } from './bookmark.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookmarkEntity } from './entity';
import { DocumentEntity } from 'src/documents/entity';

describe('BookmarkService', () => {
  let service: BookmarkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarkService,
        {
          provide: getRepositoryToken(BookmarkEntity),
          useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), delete: jest.fn() },
        },
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<BookmarkService>(BookmarkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
