import { Injectable } from '@nestjs/common';
import { FindOptionsOrder, FindOptionsWhere, MongoRepository } from 'typeorm';
import { UserEntity } from './entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: MongoRepository<UserEntity>,
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
}
