import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './entity';
import { DocumentEntity } from '../documents/entity/document.entity';
import { ObjectId } from 'mongodb';

describe('UserService', () => {
  let service: UserService;
  let userRepo: any;

  beforeEach(async () => {
    userRepo = {
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      updateOne: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      manager: {
        getMongoRepository: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepo,
        },
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: {
            manager: {
              getMongoRepository: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should use an atomic conditional update to avoid double-granting credits', async () => {
    const userId = new ObjectId().toHexString();
    const userDoc = {
      _id: new ObjectId(userId),
      creditsEverEarned: 0,
      unlockCredits: 0,
      email: 'user@example.com',
    };

    jest.spyOn(service, 'countCountingUploads').mockResolvedValue(3);
    const mongoRepo = {
      findOne: jest.fn().mockResolvedValue(userDoc),
      findOneAndUpdate: jest
        .fn()
        .mockResolvedValue({ value: { ...userDoc, creditsEverEarned: 1 } }),
    };
    userRepo.manager.getMongoRepository.mockReturnValue(mongoRepo);

    await Promise.all([
      service.reconcileUploadCredits(userId),
      service.reconcileUploadCredits(userId),
    ]);

    expect(mongoRepo.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(mongoRepo.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: new ObjectId(userId),
        creditsEverEarned: 0,
      }),
      expect.objectContaining({
        $set: { creditsEverEarned: 1 },
      }),
    );
  });
});
