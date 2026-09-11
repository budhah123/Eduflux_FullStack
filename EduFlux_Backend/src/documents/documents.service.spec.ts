import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentEntity } from './entity';
import { FileUploadService } from '@app/file-upload';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';
import { RatingService } from '../rating/rating.service';
import { BadRequestException } from '@nestjs/common';
import { DocumentStatus } from './enum';
import { UserType } from '../user/enum';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let mockFileUploadService: { getThumbnailUrl: jest.Mock };
  let mockUserService: { getUser: jest.Mock; reconcileUploadCredits: jest.Mock };

  const mongoCollection = {
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockDocumentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    updateOne: jest.fn(),
    manager: {
      getMongoRepository: jest.fn(() => ({
        manager: {
          connection: {
            mongoManager: {
              getMongoRepository: jest.fn(() => mongoCollection),
            },
          },
        },
      })),
    },
  };

  beforeEach(async () => {
    mockFileUploadService = {
      getThumbnailUrl: jest.fn(() => 'https://computed.example/thumb.jpg'),
    };
    mockUserService = {
      getUser: jest.fn(),
      reconcileUploadCredits: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: mockDocumentRepository,
        },
        {
          provide: FileUploadService,
          useValue: mockFileUploadService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: NotificationService,
          useValue: {},
        },
        {
          provide: RatingService,
          useValue: {
            getAverageRating: jest.fn().mockResolvedValue({ average: 0, count: 0 }),
            getAverageRatingForDocuments: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findPublic should only include approved/public documents without sensitive file metadata', async () => {
    mongoCollection.find.mockResolvedValue([
      {
        _id: 'doc-1',
        title: 'Approved note',
        subject: 'Physics',
        category: 'Lecture Notes',
        status: 'approved',
        isPremiumOnly: true,
        fileUrl: 'https://secret.example/file.pdf',
        fileKey: 'secret-file-key',
        resourceType: 'raw',
        fileVersion: '123',
        userId: '507f1f77bcf86cd799439011',
        description: 'Public description',
        thumbnailUrl: 'https://stored.example/thumb.jpg',
      },
      {
        _id: 'doc-2',
        title: 'Pending note',
        status: 'pending',
        fileUrl: 'https://secret.example/pending.pdf',
        userId: '507f1f77bcf86cd799439012',
      },
    ]);
    mongoCollection.count.mockResolvedValue(1);

    const result = await service.findPublic({ page: 1, limit: 10 });

    expect(result.data[0]).toMatchObject({
      _id: 'doc-1',
      title: 'Approved note',
      isLocked: true,
      thumbnailUrl: 'https://stored.example/thumb.jpg',
    });
    expect(result.data[0]).not.toHaveProperty('fileUrl');
    expect(result.data[0]).not.toHaveProperty('fileKey');
    expect(result.data[0]).not.toHaveProperty('resourceType');
    expect(result.data[0]).not.toHaveProperty('fileVersion');
    expect(result.total).toBe(1);
    expect(mockFileUploadService.getThumbnailUrl).not.toHaveBeenCalled();
  });

  it('findPublic should fall back to regex search when the Mongo text index is missing', async () => {
    mongoCollection.find
      .mockRejectedValueOnce({ code: 27, errmsg: 'text index required for $text query' })
      .mockResolvedValueOnce([
        {
          _id: 'doc-1',
          title: 'Math notes',
          status: 'approved',
          description: 'Study guide',
          userId: '507f1f77bcf86cd799439011',
          thumbnailUrl: 'https://stored.example/thumb.jpg',
        },
      ]);
    mongoCollection.count
      .mockRejectedValueOnce({ code: 27, errmsg: 'text index required for $text query' })
      .mockResolvedValueOnce(1);

    const result = await service.findPublic({ search: 'math', page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(mongoCollection.find).toHaveBeenCalledTimes(2);
    expect(mongoCollection.count).toHaveBeenCalledTimes(2);
  });

  it('create should auto-approve document when uploader is an admin', async () => {
    mockUserService.getUser.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      userType: UserType.ADMIN,
    });
    mockDocumentRepository.create.mockImplementation((data) => ({
      _id: 'doc-admin',
      ...data,
    }));
    mockDocumentRepository.save.mockImplementation((doc) =>
      Promise.resolve(doc),
    );

    const result = await service.create({
      title: 'Admin Document',
      userId: '507f1f77bcf86cd799439011',
    });

    expect(result.status).toBe(DocumentStatus.APPROVED);
  });

  it('create should leave document pending when uploader is a regular user', async () => {
    mockUserService.getUser.mockResolvedValue({
      _id: '507f1f77bcf86cd799439012',
      userType: UserType.USER,
    });
    mockDocumentRepository.create.mockImplementation((data) => ({
      _id: 'doc-user',
      ...data,
    }));
    mockDocumentRepository.save.mockImplementation((doc) =>
      Promise.resolve(doc),
    );

    const result = await service.create({
      title: 'User Document',
      userId: '507f1f77bcf86cd799439012',
    });

    expect(result.status).toBe(DocumentStatus.PENDING);
  });

  it('setHomePageStatus should allow setting isHomePage = true when fewer than 4 are featured', async () => {
    mockDocumentRepository.findOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      title: 'Note 1',
      isHomePage: false,
    });
    mongoCollection.count.mockResolvedValue(3);
    mockDocumentRepository.updateOne.mockResolvedValue({ matchedCount: 1 });

    const result = await service.setHomePageStatus('507f1f77bcf86cd799439011', true);
    expect(mockDocumentRepository.updateOne).toHaveBeenCalled();
  });

  it('setHomePageStatus should reject setting isHomePage = true when 4 documents are already featured', async () => {
    mockDocumentRepository.findOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      title: 'Note 1',
      isHomePage: false,
    });
    mongoCollection.count.mockResolvedValue(4);

    await expect(
      service.setHomePageStatus('507f1f77bcf86cd799439011', true),
    ).rejects.toThrow(BadRequestException);
  });
});
