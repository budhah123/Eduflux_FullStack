// src/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionEntity } from 'src/subscription/entity';
import { UserEntity } from 'src/user/entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([SubscriptionEntity, UserEntity]),
    NotificationModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
