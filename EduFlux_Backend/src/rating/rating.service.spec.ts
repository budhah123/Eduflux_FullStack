import { Test, TestingModule } from '@nestjs/testing';
import { RatingService } from './rating.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RatingEntity } from './entity';
import { DocumentEntity } from 'src/documents/entity';
import { UserService } from 'src/user/user.service';

describe('RatingService', () => {
  let service: RatingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingService,
        {
          provide: getRepositoryToken(RatingEntity),
          useValue: { find: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: UserService,
          useValue: { getUser: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<RatingService>(RatingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
