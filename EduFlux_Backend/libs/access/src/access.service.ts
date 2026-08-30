// src/access/access.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/user/entity';
import { SubscriptionEntity } from 'src/subscription/entity';
import { UnlockedDocumentEntity } from './entity/unlocked-document.entity';
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
    @InjectRepository(UnlockedDocumentEntity)
    private unlockedDocRepo: Repository<UnlockedDocumentEntity>,
  ) {}

  async checkViewAccess(
    user: UserEntity,
    documentId?: string,
  ): Promise<AccessResult> {
    if (user.isInstitutional && user.isVerified) {
      return { access: true, reason: 'institutional' };
    }

    return this.checkOrGrantAccess(user, documentId);
  }

  async checkDownloadAccess(
    user: UserEntity,
    documentId?: string,
  ): Promise<AccessResult> {
    // No institutional bypass — but if THIS document was already
    // unlocked (e.g. institutional user later earns a credit, or a
    // regular user already unlocked it via view), reuse that record
    return this.checkOrGrantAccess(user, documentId);
  }

  async checkAccess(
    user: UserEntity,
    documentId?: string,
  ): Promise<AccessResult> {
    return this.checkViewAccess(user, documentId);
  }

  private async checkOrGrantAccess(
    user: UserEntity,
    documentId?: string,
  ): Promise<AccessResult> {
    const userId = user._id?.toString();
    const docId = documentId ? String(documentId) : '';

    // 1. Already unlocked this exact document before? Free access,
    //    no new charge, works for view AND download from now on.
    if (userId && docId) {
      const existing = await this.unlockedDocRepo.findOne({
        where: {
          userId,
          documentId: docId,
        } as any,
      });
      if (existing) {
        return { access: true, reason: existing.unlockedVia as any };
      }
    }

    // 2. Active subscription — grants access to ALL premium docs,
    //    no need to create per-document records for this path.
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

    // 3. Spend a credit ONCE, then permanently record this document
    //    as unlocked for this user (covers both view and download).
    if (user.unlockCredits > 0) {
      user.unlockCredits -= 1;
      await this.userRepo.save(user);

      if (userId && docId) {
        try {
          await this.unlockedDocRepo.save(
            this.unlockedDocRepo.create({
              userId,
              documentId: docId,
              unlockedVia: 'upload_credit',
            }),
          );
        } catch (err) {
          // If duplicate key occurred concurrently, it is already recorded
          console.warn('Unlocked document save duplicate/warning:', err);
        }
      }

      return { access: true, reason: 'upload_credit' };
    }

    return { access: false, reason: 'locked' };
  }
}
