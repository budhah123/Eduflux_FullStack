import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { ReportEntity } from './entity';
import { CreateReportInput } from './dto';
import { DocumentEntity } from 'src/documents/entity';
import { AuditLogService } from 'src/audit-log/audit-log.service';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportRepository: MongoRepository<ReportEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: MongoRepository<DocumentEntity>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createReport(reporterId: string, dto: CreateReportInput) {
    if (!ObjectId.isValid(dto.documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    const document = await this.documentRepository.findOne({
      where: { _id: new ObjectId(dto.documentId) },
    });

    if (!document) {
      throw new NotFoundException(
        `Document with ID ${dto.documentId} not found`,
      );
    }

    const existing = await this.reportRepository.findOne({
      where: { reporterId, documentId: dto.documentId },
    } as any);

    if (existing) {
      throw new ConflictException("You've already reported this");
    }

    const report = this.reportRepository.create({
      documentId: dto.documentId,
      reporterId,
      reason: dto.reason,
      details: dto.details,
      status: 'pending',
    });

    const saved = await this.reportRepository.save(report);
    const pendingCount = await this.reportRepository.count({
      documentId: dto.documentId,
      status: 'pending',
    } as any);

    return {
      ...saved,
      priorityReview: pendingCount >= 3,
    };
  }

  async getAllReports(
    filter: { status?: string },
    pagination?: { page?: number; limit?: number },
  ) {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const where: any = {};

    if (filter?.status) {
      where.status = filter.status;
    }

    const [data, total] = await this.reportRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    } as any);

    const enriched = await Promise.all(
      data.map(async (report) => {
        const pendingCount = await this.reportRepository.count({
          documentId: report.documentId,
          status: 'pending',
        } as any);

        return {
          ...report,
          priorityReview:
            pendingCount >= 3 && (report.status || 'pending') === 'pending',
        };
      }),
    );

    return {
      data: enriched,
      total,
    };
  }

  async updateReportStatus(reportId: string, status: string, adminId: string) {
    if (!ObjectId.isValid(reportId)) {
      throw new BadRequestException('Invalid report ID');
    }

    const normalizedStatus = [
      'pending',
      'reviewed',
      'dismissed',
      'actioned',
    ].includes(status)
      ? status
      : 'reviewed';

    const report = await this.reportRepository.findOne({
      where: { _id: new ObjectId(reportId) },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = normalizedStatus;
    const saved = await this.reportRepository.save(report);

    await this.auditLogService.logAdminAction({
      adminUserId: adminId,
      action: 'updated_report_status',
      targetType: 'report',
      targetId: reportId,
      targetName: report.documentId,
      details: `Report status changed to ${normalizedStatus}`,
      timestamp: new Date(),
    });

    return saved;
  }
}
