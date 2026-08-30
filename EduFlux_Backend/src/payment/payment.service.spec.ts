import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { throwError } from 'rxjs';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentProvider } from 'src/subscription/enum/payment-provider.enum';
import { SubscriptionEntity } from 'src/subscription/entity';
import { UserEntity } from 'src/user/entity';
import { NotificationService } from 'src/notification/notification.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpService: { get: jest.Mock };

  beforeEach(async () => {
    httpService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: HttpService, useValue: httpService },
        {
          provide: getRepositoryToken(SubscriptionEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {},
        },
        {
          provide: NotificationService,
          useValue: { createNotification: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    delete process.env.ESEWA_SANDBOX_BYPASS;
  });

  it('should fail closed when eSewa verification fails unexpectedly', async () => {
    process.env.ESEWA_SANDBOX_BYPASS = 'false';
    httpService.get.mockReturnValue(
      throwError(() => new Error('eSewa verify API unavailable')),
    );

    await expect(
      service.verifyPayment('user-123', {
        provider: PaymentProvider.ESEWA,
        amount: 100,
        transactionUuid: 'fake-transaction-uuid',
      } as any),
    ).resolves.toBe(false);
  });

  it('should only allow the sandbox bypass when explicitly enabled', async () => {
    process.env.ESEWA_SANDBOX_BYPASS = 'true';
    httpService.get.mockReturnValue(
      throwError(() => new Error('eSewa verify API unavailable')),
    );

    await expect(
      service.verifyPayment('user-123', {
        provider: PaymentProvider.ESEWA,
        amount: 100,
        transactionUuid: 'fake-transaction-uuid',
      } as any),
    ).resolves.toBe(true);
  });
});
