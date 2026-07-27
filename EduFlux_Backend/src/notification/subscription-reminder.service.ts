// src/notification/subscription-reminder.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';

import { NotificationService } from './notification.service';
import { NotificationType } from './enum';
import { SubscriptionEntity } from '../subscription/entity';
import { SubscriptionStatus } from 'src/subscription/enum/subscription-status.enum';

@Injectable()
export class SubscriptionReminderService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private subscriptionRepository: MongoRepository<SubscriptionEntity>,
    private notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringSubscriptions() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const activeSubs = await this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    for (const sub of activeSubs) {
      if (
        sub.expiryDate &&
        sub.expiryDate <= threeDaysFromNow &&
        sub.expiryDate > new Date()
      ) {
        const userId = sub.user?._id?.toString();

        if (userId) {
          await this.notificationService.createNotification({
            userId,
            type: NotificationType.SUBSCRIPTION_EXPIRING,
            title: 'Subscription Expiring Soon',
            message: `Your subscription expires on ${sub.expiryDate.toDateString()}. Renew to keep access.`,
            link: '/subscription',
          });
        }
      }
    }
  }
}
