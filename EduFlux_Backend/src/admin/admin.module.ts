import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { AdminUserController } from './user/admin-user.controller';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminDocumentController } from './document/admin-document.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { DocumentsModule } from 'src/documents/documents.module';
import { FileUploadModule } from '@app/file-upload';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditLogEntity } from '../audit-log/entity';
import { UserEntity } from 'src/user/entity';
import { DocumentEntity } from 'src/documents/entity';
import { SubscriptionEntity } from 'src/subscription/entity';
import { MailModule } from '@app/mail';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuditLogEntity,
      UserEntity,
      DocumentEntity,
      SubscriptionEntity,
    ]),
    UserModule,
    AuthModule,
    DocumentsModule,
    FileUploadModule,
    MailModule,
  ],
  controllers: [
    AdminDashboardController,
    AdminUserController,
    AdminAuthController,
    AdminDocumentController,
  ],
  providers: [AdminService, AuditLogService],
})
export class AdminModule {}
