import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { UserEntity } from 'src/user/entity';
import { DocumentEntity } from 'src/documents/entity';
import { SubscriptionEntity } from 'src/subscription/entity';
import { AuditLogService } from 'src/audit-log/audit-log.service';


describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            count: jest.fn().mockResolvedValue(2),
          },
        },
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: {
            count: jest.fn().mockResolvedValue(3),
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(SubscriptionEntity),
          useValue: {
            count: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            logAdminAction: jest.fn().mockImplementation(async (input) => ({
              ...input,
              timestamp: input.timestamp ?? new Date(),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should expose dashboard summary counts', async () => {
    const stats = await service.getDashboardStats();

    expect(stats).toEqual(
      expect.objectContaining({
        totalUsers: expect.any(Number),
        totalDocuments: expect.any(Number),
        documentsByStatus: expect.any(Object),
        activeSubscriptions: expect.any(Number),
      }),
    );
  });

  it('should log admin actions with a timestamp and actor', async () => {
    const result = await service.logAdminAction({
      adminUserId: 'admin-1',
      action: 'approved_document',
      targetType: 'document',
      targetId: 'doc-1',
      targetName: 'Sample doc',
    });

    expect(result).toEqual(
      expect.objectContaining({
        adminUserId: 'admin-1',
        action: 'approved_document',
        targetType: 'document',
        targetId: 'doc-1',
        timestamp: expect.any(Date),
      }),
    );
  });
});
