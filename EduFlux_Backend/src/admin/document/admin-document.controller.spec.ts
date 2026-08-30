import { Test, TestingModule } from '@nestjs/testing';
import { AdminDocumentController } from './admin-document.controller';
import { DocumentsService } from 'src/documents/documents.service';
import { FileUploadService } from '@app/file-upload';
import { UserService } from 'src/user/user.service';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { MailService } from '@app/mail';

describe('AdminDocumentController', () => {
  let controller: AdminDocumentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDocumentController],
      providers: [
        {
          provide: DocumentsService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            adminUpdate: jest.fn(),
            deleteAsAdmin: jest.fn(),
            changeStatus: jest.fn(),
          },
        },
        {
          provide: FileUploadService,
          useValue: { uploadFile: jest.fn() },
        },
        {
          provide: UserService,
          useValue: { getUser: jest.fn() },
        },
        {
          provide: AuditLogService,
          useValue: { logAdminAction: jest.fn() },
        },
        {
          provide: MailService,
          useValue: {
            sendDocumentApprovedEmail: jest.fn(),
            sendDocumentRejectedEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminDocumentController>(AdminDocumentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
