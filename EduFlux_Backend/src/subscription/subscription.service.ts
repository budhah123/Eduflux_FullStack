import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { UserEntity } from 'src/user/entity';
import { FindOptionsOrder, FindOptionsWhere, MongoRepository } from 'typeorm';
import { SubscriptionEntity } from './entity';
import { SubscriptionStatus } from './enum/subscription-status.enum';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: MongoRepository<SubscriptionEntity>,
  ) {}

  async getSubscriptions(
    whereParams: FindOptionsWhere<SubscriptionEntity | any>,
    orderParams?: FindOptionsOrder<SubscriptionEntity | any>,
    paginationInput?: {
      page?: number;
      limit?: number;
    },
  ) {
    return this.subscriptionRepository.findAndCount({
      where: whereParams,
      order: orderParams,
      skip: ((paginationInput?.page ?? 1) - 1) * (paginationInput?.limit ?? 10),
      take: paginationInput?.limit ?? 10,
    });
  }

  async getSubscription(
    whereParams: FindOptionsWhere<SubscriptionEntity | any> | string,
  ) {
    if (typeof whereParams === 'string') {
      const userId = whereParams;
      const userObjectId = ObjectId.isValid(userId)
        ? new ObjectId(userId)
        : userId;

      return this.subscriptionRepository.findOne({
        where: {
          $or: [
            { userId },
            { userId: userObjectId },
            { 'user._id': userObjectId },
            { 'user._id': userId },
          ],
        } as any,
      });
    }

    return await this.subscriptionRepository.findOne({
      where: whereParams,
    });
  }

  async cancelSubscription(userid: string) {
    const subscription = await this.getSubscription(userid);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    subscription.status = SubscriptionStatus.INACTIVE;
    await this.subscriptionRepository.save(subscription);
  }
}
