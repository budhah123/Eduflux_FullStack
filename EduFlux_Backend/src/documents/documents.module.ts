import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from './entity';
import { FileUploadModule } from '@app/file-upload';
import { UserModule } from '../user/user.module';
import { AccessModule } from '@app/access';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentEntity]),
    FileUploadModule,
    UserModule,
    AccessModule
  ],
  providers: [DocumentsService],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}

