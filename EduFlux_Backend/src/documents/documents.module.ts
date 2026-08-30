import { Module, OnModuleInit } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from './entity';
import { FileUploadModule } from '@app/file-upload';
import { UserModule } from '../user/user.module';
import { AccessModule } from '@app/access';
import { NotificationModule } from '../notification/notification.module';
import { RatingModule } from 'src/rating/rating.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentEntity]),
    FileUploadModule,
    UserModule,
    AccessModule,
    NotificationModule,
    RatingModule,
  ],
  providers: [DocumentsService],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule implements OnModuleInit {
  constructor(private readonly documentsService: DocumentsService) {}

  async onModuleInit() {
    await this.documentsService.ensureDocumentSearchIndex();
  }
}
