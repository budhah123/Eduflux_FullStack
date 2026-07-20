// src/access/access.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/user/entity';
import { SubscriptionEntity } from 'src/subscription/entity';
import { SubscriptionStatus } from 'src/subscription/enum/subscription-status.enum';


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

  async checkAccess(user: UserEntity): Promise<AccessResult> {
    // Path 1: Techspire institutional student — always free
    if (user.isInstitutional) {
      return { access: true, reason: 'institutional' };
    }

    // Path 2: Active paid subscription (Khalti/eSewa)
    const sub = await this.subRepo.findOneBy({ 'user._id': user._id } as any);
    if (
      sub &&
      sub.status === SubscriptionStatus.ACTIVE &&
      sub.expiryDate &&
      sub.expiryDate > new Date()
    ) {
      return { access: true, reason: 'subscription' };
    }

    // Path 3: Upload-earned unlock credit (3 approved uploads = 1 credit)
    if (user.unlockCredits > 0) {
      user.unlockCredits -= 1;
      await this.userRepo.save(user);
      return { access: true, reason: 'upload_credit' };
    }

    // None matched
    return { access: false, reason: 'locked' };
  }
}