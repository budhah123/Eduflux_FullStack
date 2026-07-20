import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { AdminUserController } from './user/admin-user.controller';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminDocumentController } from './document/admin-document.controller';
import { DocumentsModule } from 'src/documents/documents.module';
import { FileUploadModule } from '@app/file-upload';

@Module({
  imports: [UserModule, AuthModule, DocumentsModule, FileUploadModule],
  controllers: [
    AdminUserController,
    AdminAuthController,
    AdminDocumentController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
