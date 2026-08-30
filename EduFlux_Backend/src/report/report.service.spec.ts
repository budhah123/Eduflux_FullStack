import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportEntity } from './entity';
import { DocumentEntity } from 'src/documents/entity';
import { AuditLogService } from 'src/audit-log/audit-log.service';

describe('ReportService', () => {
  let service: ReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getRepositoryToken(ReportEntity),
          useValue: { find: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: AuditLogService,
          useValue: { logAdminAction: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
