import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UsersController } from './users.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity';
import { FileUploadModule } from '@app/file-upload';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), FileUploadModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
