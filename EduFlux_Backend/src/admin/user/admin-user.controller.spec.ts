import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserController } from './admin-user.controller';
import { UserService } from 'src/user/user.service';
import { AuditLogService } from 'src/audit-log/audit-log.service';

describe('AdminUserController', () => {
  let controller: AdminUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            createUser: jest.fn(),
            getUsers: jest.fn(),
            getUser: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: { logAdminAction: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AdminUserController>(AdminUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
