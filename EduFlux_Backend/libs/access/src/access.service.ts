// src/access/access.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/user/entity';
import { SubscriptionEntity } from 'src/subscription/entity';
import { SubscriptionStatus } from 'src/subscription/enum/subscription-status.enum';
import { ObjectId } from 'mongodb';

export interface AccessResult {
  access: boolean;
  reason: 'institutional' | 'subscription' | 'upload_credit' | 'locked';
}

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    @InjectRepository(SubscriptionEntity)
    private subRepo: Repository<SubscriptionEntity>,
  ) {}

  async checkViewAccess(user: UserEntity): Promise<AccessResult> {
    if (user.isInstitutional && user.isVerified) {
      return { access: true, reason: 'institutional' };
    }

    return this.checkPaidAccess(user);
  }

  async checkDownloadAccess(user: UserEntity): Promise<AccessResult> {
    return this.checkPaidAccess(user);
  }

  async checkAccess(user: UserEntity): Promise<AccessResult> {
    return this.checkViewAccess(user);
  }

  private async checkPaidAccess(user: UserEntity): Promise<AccessResult> {
    const userId = user._id?.toString();
    const userObjectId =
      userId && ObjectId.isValid(userId) ? new ObjectId(userId) : user._id;
    const sub = await this.subRepo.findOne({
      where: {
        $or: [
          { userId },
          { userId: userObjectId },
          { 'user._id': userObjectId },
          { 'user._id': userId },
        ],
      } as any,
    });
    if (
      sub &&
      sub.status === SubscriptionStatus.ACTIVE &&
      sub.expiryDate &&
      sub.expiryDate > new Date()
    ) {
      return { access: true, reason: 'subscription' };
    }

    if (user.unlockCredits > 0) {
      user.unlockCredits -= 1;
      await this.userRepo.save(user);
      return { access: true, reason: 'upload_credit' };
    }

    return { access: false, reason: 'locked' };
  }
}
