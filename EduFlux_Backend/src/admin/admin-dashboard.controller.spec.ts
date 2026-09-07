import { Test, TestingModule } from '@nestjs/testing';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminService } from './admin.service';

describe('AdminDashboardController', () => {
  let controller: AdminDashboardController;
  let adminService: jest.Mocked<Partial<AdminService>>;

  beforeEach(async () => {
    adminService = {
      getComprehensiveDashboardStats: jest.fn().mockResolvedValue({
        kpi: {
          totalUsers: 15,
          institutionalUsers: 8,
          subscribers: 5,
          totalDocs: 22,
          revenue: 'NPR 4,995',
        },
        charts: {
          monthlyData: [],
          weeklyData: [],
        },
        userTypes: {
          total: 15,
          studentPercent: 60,
          subscriberPercent: 33,
          guestPercent: 7,
        },
        dailyUploads: {
          bars: [],
          todayCount: 2,
          avgProcessingTime: '1.2s',
        },
        recentActivity: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDashboardController],
      providers: [
        {
          provide: AdminService,
          useValue: adminService,
        },
      ],
    }).compile();

    controller = module.get<AdminDashboardController>(AdminDashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return comprehensive stats', async () => {
    const res = await controller.getStats();
    expect(res).toBeDefined();
    expect(res.kpi.totalUsers).toBe(15);
    expect(adminService.getComprehensiveDashboardStats).toHaveBeenCalled();
  });
});
