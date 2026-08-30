import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UsersController } from './users.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity';
import { DocumentEntity } from '../documents/entity/document.entity';
import { FileUploadModule } from '@app/file-upload';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, DocumentEntity]),
    FileUploadModule,
  ],
  controllers: [UserController, UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
