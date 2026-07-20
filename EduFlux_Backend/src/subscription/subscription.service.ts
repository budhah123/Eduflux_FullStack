import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
    whereParams: FindOptionsWhere<SubscriptionEntity | any>,
  ) {
    return await this.subscriptionRepository.findOne({
      where: whereParams,
    });
  }

  async cancelSubscription(userid: string) {
    const subscription = await this.getSubscription({ userId: userid });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    subscription.status = SubscriptionStatus.INACTIVE;
    await this.subscriptionRepository.save(subscription);
  }
}
