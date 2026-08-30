import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsOrder, FindOptionsWhere, MongoRepository } from 'typeorm';
import { UserEntity } from './entity';
import { DocumentEntity } from '../documents/entity/document.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: MongoRepository<UserEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: MongoRepository<DocumentEntity>,
  ) {}

  async createUser(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async getUsers(
    whereParams?: FindOptionsWhere<UserEntity | any>,
    orderParams?: FindOptionsOrder<UserEntity | any>,
    paginationInput?: {
      page?: number;
      limit?: number;
    },
  ) {
    return this.userRepository.findAndCount({
      where: whereParams || {},
      order: orderParams || { createdAt: 'DESC' },
      skip: ((paginationInput?.page ?? 1) - 1) * (paginationInput?.limit ?? 10),
      take: paginationInput?.limit ?? 10,
    });
  }

  async getUser(whereParams: FindOptionsWhere<UserEntity | any>) {
    return this.userRepository.findOne({
      where: whereParams,
    });
  }

  async updateUser(id: string, data: Partial<UserEntity>) {
    if (data.password && data.password !== '') {
      //hash password before updating
      data.password = bcrypt.hashSync(data.password, 10);
    }
    return await this.userRepository.update(id, data);
  }
  async deleteUser(id: string) {
    return await this.userRepository.delete(id);
  }

  /**
   * Exposes the underlying MongoRepository so callers can perform
   * atomic findOneAndUpdate / updateOne operations directly on the
   * users collection without going through the high-level service API.
   */
  getUserMongoRepository() {
    return this.userRepository.manager.getMongoRepository(UserEntity);
  }

  async changePassword(id: string, oldPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: { _id: new ObjectId(id) },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.password) {
      throw new BadRequestException(
        'This account has no password set (signed up via Google).',
      );
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      throw new BadRequestException('Current password is incorrect');
    await this.updateUser(id, { password: newPassword });
    return { message: 'Password changed successfully' };
  }

  async countCountingUploads(userId: string): Promise<number> {
    if (!userId) return 0;

    const userStr = String(userId);
    const orConditions: any[] = [{ userId: userStr }];

    if (ObjectId.isValid(userStr)) {
      orConditions.push({ userId: new ObjectId(userStr) });
    }

    const collection = this.documentRepository.manager
      .getMongoRepository(DocumentEntity)
      .manager.connection.mongoManager.getMongoRepository(DocumentEntity);

    return collection.count({
      $and: [
        { $or: orConditions },
        {
          status: {
            $in: ['pending', 'approved', 'published'],
          },
        },
      ],
    });
  }

  async reconcileUploadCredits(userId: string): Promise<void> {
    if (!userId) return;

    const objectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
    const userCollection =
      this.userRepository.manager.getMongoRepository(UserEntity);

    while (true) {
      const freshUser = await userCollection.findOne({ _id: objectId } as any);
      if (!freshUser) return;

      const documentsCount = await this.countCountingUploads(userId);
      const totalEarned = Math.floor(documentsCount / 3);
      const latestCredits = Number(freshUser.creditsEverEarned || 0);

      if (totalEarned <= latestCredits) return;

      const newlyEarned = totalEarned - latestCredits;
      const result = await userCollection.findOneAndUpdate(
        {
          _id: objectId,
          creditsEverEarned: latestCredits,
        } as any,
        {
          $set: { creditsEverEarned: totalEarned },
          $inc: { unlockCredits: newlyEarned },
        } as any,
      );

      if (result?.value || result?.lastErrorObject?.n === 1) return;
    }
  }
}
