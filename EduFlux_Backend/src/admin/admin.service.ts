import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { UserEntity } from 'src/user/entity';
import { DocumentEntity } from 'src/documents/entity';
import { SubscriptionEntity } from 'src/subscription/entity';
import { SubscriptionStatus } from 'src/subscription/enum/subscription-status.enum';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditLogEntity } from '../audit-log/entity';
import { DocumentStatus } from 'src/documents/enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: MongoRepository<UserEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: MongoRepository<DocumentEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: MongoRepository<SubscriptionEntity>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalDocuments, activeSubscriptions, documents] =
      await Promise.all([
        this.userRepository.count(),
        this.documentRepository.count(),
        this.subscriptionRepository.count({
          where: { status: SubscriptionStatus.ACTIVE },
        }),
        this.documentRepository.find(),
      ]);

    const documentsByStatus = Object.values(DocumentStatus).reduce(
      (acc, currentStatus) => ({
        ...acc,
        [currentStatus]: 0,
      }),
      {} as Record<string, number>,
    );

    for (const document of documents) {
      const key = document.status || 'unknown';
      documentsByStatus[key] = (documentsByStatus[key] || 0) + 1;
    }

    return {
      totalUsers,
      totalDocuments,
      documentsByStatus,
      activeSubscriptions,
      generatedAt: new Date(),
    };
  }

  async logAdminAction(input: Partial<AuditLogEntity>) {
    return this.auditLogService.logAdminAction({
      ...input,
      timestamp: input.timestamp ?? new Date(),
    });
  }
}
