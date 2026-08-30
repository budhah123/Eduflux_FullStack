import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentEntity } from './entity';
import { FileUploadService } from '@app/file-upload';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let mockFileUploadService: { getThumbnailUrl: jest.Mock };

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
          useValue: {
            getUser: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {},
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
});
