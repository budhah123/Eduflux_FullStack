// notification.module.ts
import { SubscriptionEntity } from '../subscription/entity';
import { SubscriptionReminderService } from './subscription-reminder.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity, SubscriptionEntity])],
  controllers: [NotificationController],
  providers: [NotificationService, SubscriptionReminderService],
  exports: [NotificationService],
})
export class NotificationModule {}
