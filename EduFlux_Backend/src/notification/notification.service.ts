import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationEntity } from './entity';
import { FindOptionsWhere, MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: MongoRepository<NotificationEntity>,
  ) { }

  // notification.service.ts
  async createNotification(
    data: Partial<NotificationEntity>,
  ): Promise<NotificationEntity> {
    const normalizedData = {
      ...data,
      userId: data.userId?.toString(), // ← always force string, regardless of caller
    };
    const notification = this.notificationRepository.create(normalizedData);
    return this.notificationRepository.save(notification);
  }

  async getNotifications(
    whereParams?: FindOptionsWhere<NotificationEntity | any>,
    orderParams?: FindOptionsWhere<NotificationEntity | any>,
    paginationInput?: {
      page?: number;
      limit?: number;
    },
  ) {
    return await this.notificationRepository.findAndCount({
      where: whereParams || {},
      order: orderParams || { createdAt: 'DESC' },
      skip: ((paginationInput?.page ?? 1) - 1) * (paginationInput?.limit ?? 10),
      take: paginationInput?.limit ?? 10,
    });
  }

  async getNotification(
    whereParams: FindOptionsWhere<NotificationEntity | any>,
  ) {
    return await this.notificationRepository.findOne({
      where: whereParams,
    });
  }

  // notification.service.ts
  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      userId,
      isRead: false,
    }); // ← no `where` wrapper, pass fields directly
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { _id: new ObjectId(id) },
    });
    if (!notification || notification.userId !== userId) return null;
    return await this.notificationRepository.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string) {
    const unread = await this.notificationRepository.find({
      where: { userId, isRead: false },
    });
    const ids = unread.map((n) => n._id);
    if (ids.length === 0) return { affected: 0 };

    return await this.notificationRepository.updateMany(
      { _id: { $in: ids } } as any,
      { $set: { isRead: true } } as any,
    );
  }

  async deleteNotification(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { _id: new ObjectId(id) },
    });
    if (!notification || notification.userId !== userId) return null;
    return await this.notificationRepository.delete(id);
  }
}
