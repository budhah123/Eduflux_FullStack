import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { UserEntity } from 'src/user/entity';
import { DocumentEntity } from 'src/documents/entity';
import { SubscriptionEntity } from 'src/subscription/entity';
import { SubscriptionStatus } from 'src/subscription/enum/subscription-status.enum';
import { PlanType } from 'src/subscription/enum/plan-type.enum';
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

  async getComprehensiveDashboardStats() {
    const [allUsers, allDocuments, activeSubscriptions, subscriptions, auditLogs] =
      await Promise.all([
        this.userRepository.find(),
        this.documentRepository.find(),
        this.subscriptionRepository.count({
          where: { status: SubscriptionStatus.ACTIVE },
        }),
        this.subscriptionRepository.find(),
        this.auditLogService.getRecentLogs(5),
      ]);

    const totalUsers = allUsers.length;
    const totalDocuments = allDocuments.length;

    // Check institutional email domains
    const isInstitutionalEmail = (email: string = '') => {
      const lower = email.toLowerCase();
      return (
        lower.endsWith('.edu') ||
        lower.endsWith('.edu.np') ||
        lower.endsWith('.ac.np') ||
        lower.endsWith('.ac.uk') ||
        lower.endsWith('.edu.cn') ||
        lower.endsWith('.edu.in')
      );
    };

    const institutionalUsers = allUsers.filter(
      (u) => (u as any).isInstitutional || isInstitutionalEmail(u.email),
    ).length;

    // Calculate revenue from active subscriptions
    let revenue = 0;
    for (const sub of subscriptions) {
      if (sub.status === SubscriptionStatus.ACTIVE) {
        revenue += sub.planType === PlanType.YEARLY ? 999 : 499;
      }
    }
    const formattedRevenue = `NPR ${revenue.toLocaleString()}`;

    // Calculate dynamic Monthly Registrations (last 6 months)
    const now = new Date();
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthlyBuckets: {
      label: string;
      year: number;
      month: number;
      count: number;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyBuckets.push({
        label: monthNames[d.getMonth()],
        year: d.getFullYear(),
        month: d.getMonth(),
        count: 0,
      });
    }

    // Calculate dynamic Weekly Registrations (last 6 weeks)
    const weeklyBuckets: {
      label: string;
      start: Date;
      end: Date;
      count: number;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      weeklyBuckets.push({
        label: `W${6 - i}`,
        start,
        end,
        count: 0,
      });
    }

    // Populate user registration buckets
    for (const user of allUsers) {
      const created = user.createdAt ? new Date(user.createdAt) : new Date();
      for (const bucket of monthlyBuckets) {
        if (
          created.getFullYear() === bucket.year &&
          created.getMonth() === bucket.month
        ) {
          bucket.count++;
          break;
        }
      }
      for (const bucket of weeklyBuckets) {
        if (created >= bucket.start && created < bucket.end) {
          bucket.count++;
          break;
        }
      }
    }

    // Format monthly and weekly chart data with proportional bar heights
    const maxMonth = Math.max(...monthlyBuckets.map((m) => m.count), 1);
    const monthlyData = monthlyBuckets.map((m) => ({
      label: m.label,
      value: m.count,
      height: `${Math.max(15, Math.round((m.count / maxMonth) * 100))}%`,
    }));

    const maxWeek = Math.max(...weeklyBuckets.map((w) => w.count), 1);
    const weeklyData = weeklyBuckets.map((w) => ({
      label: w.label,
      value: w.count,
      height: `${Math.max(15, Math.round((w.count / maxWeek) * 100))}%`,
    }));

    // User Types breakdown
    const studentsCount = allUsers.filter(
      (u) => u.userType === 'USER' || !u.userType,
    ).length;
    const facultyAdminCount = allUsers.filter(
      (u) => u.userType === 'ADMIN',
    ).length;
    const subscribersCount = activeSubscriptions;
    const guestsCount = Math.max(
      0,
      totalUsers - studentsCount - facultyAdminCount,
    );

    const safeTotalUsers = totalUsers || 1;
    const studentPercent = Math.round((studentsCount / safeTotalUsers) * 100);
    const subscriberPercent = Math.round(
      (subscribersCount / safeTotalUsers) * 100,
    );
    const guestPercent = Math.max(0, 100 - studentPercent - subscriberPercent);

    // Daily Uploads for last 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyUploadBuckets: {
      label: string;
      dateStr: string;
      count: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dailyUploadBuckets.push({
        label: dayNames[d.getDay()],
        dateStr: d.toISOString().split('T')[0],
        count: 0,
      });
    }

    let todayUploads = 0;
    const todayStr = now.toISOString().split('T')[0];

    for (const doc of allDocuments) {
      if (doc.createdAt) {
        const docDateStr = new Date(doc.createdAt).toISOString().split('T')[0];
        const bucket = dailyUploadBuckets.find((b) => b.dateStr === docDateStr);
        if (bucket) {
          bucket.count++;
        }
        if (docDateStr === todayStr) {
          todayUploads++;
        }
      }
    }

    const maxDaily = Math.max(...dailyUploadBuckets.map((d) => d.count), 1);
    const dailyUploads = dailyUploadBuckets.map((d) => ({
      label: d.label,
      value: d.count,
      height: `${Math.max(15, Math.round((d.count / maxDaily) * 100))}%`,
    }));

    // Dynamic Recent Activity
    const formattedActivities: any[] = [];
    for (const log of auditLogs) {
      formattedActivities.push({
        title: log.targetName || log.details || 'System Action',
        action: (log.action || '').replace(/_/g, ' '),
        subject: log.adminUserId || 'Admin',
        meta: log.timestamp
          ? this.formatTimeAgo(new Date(log.timestamp))
          : 'Recently',
        status: 'Processed',
        statusClass: 'bg-emerald-100 text-emerald-700',
        icon:
          log.targetType === 'document'
            ? 'description'
            : log.targetType === 'user'
              ? 'person'
              : 'auto_awesome',
        iconClass:
          log.targetType === 'document'
            ? 'bg-[#3525cd]/10 text-[#3525cd]'
            : 'bg-[#712ae2]/10 text-[#712ae2]',
        borderClass:
          log.targetType === 'document'
            ? 'border-l-4 border-[#3525cd]'
            : 'border-l-4 border-[#712ae2]',
      });
    }

    if (formattedActivities.length < 5) {
      const sortedRecentDocs = [...allDocuments]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        )
        .slice(0, 5 - formattedActivities.length);

      for (const doc of sortedRecentDocs) {
        formattedActivities.push({
          title: doc.title,
          action: 'uploaded to repository',
          subject: doc.category || 'Academic',
          meta: doc.createdAt
            ? this.formatTimeAgo(new Date(doc.createdAt))
            : 'Recently',
          status: doc.status || 'pending',
          statusClass:
            doc.status === 'published' || doc.status === 'approved'
              ? 'bg-emerald-100 text-emerald-700'
              : doc.status === 'rejected'
                ? 'bg-rose-100 text-rose-700'
                : 'bg-amber-100 text-amber-700',
          icon: 'description',
          iconClass: 'bg-[#3525cd]/10 text-[#3525cd]',
          borderClass: 'border-l-4 border-[#3525cd]',
        });
      }
    }

    return {
      kpi: {
        totalUsers,
        institutionalUsers,
        subscribers: activeSubscriptions,
        totalDocs: totalDocuments,
        revenue: formattedRevenue,
        rawRevenue: revenue,
      },
      charts: {
        monthlyData,
        weeklyData,
      },
      userTypes: {
        total: totalUsers,
        studentsCount,
        studentPercent,
        facultyAdminCount,
        subscribersCount,
        subscriberPercent,
        guestsCount,
        guestPercent,
      },
      dailyUploads: {
        bars: dailyUploads,
        todayCount: todayUploads,
        avgProcessingTime: '1.2s',
      },
      recentActivity: formattedActivities.slice(0, 5),
      generatedAt: new Date(),
    };
  }

  private formatTimeAgo(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  async logAdminAction(input: Partial<AuditLogEntity>) {
    return this.auditLogService.logAdminAction({
      ...input,
      timestamp: input.timestamp ?? new Date(),
    });
  }
}
