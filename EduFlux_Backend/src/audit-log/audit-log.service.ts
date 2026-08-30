import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { AuditLogEntity } from './entity';


@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: MongoRepository<AuditLogEntity>,
  ) {}

  async logAdminAction(
    input: Partial<AuditLogEntity>,
  ): Promise<AuditLogEntity> {
    const auditLog = this.auditLogRepository.create({
      ...input,
      timestamp: input.timestamp ?? new Date(),
    });

    return this.auditLogRepository.save(auditLog);
  }

  async getRecentLogs(limit = 20) {
    return this.auditLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
