import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { ConfigModule } from '@nestjs/config';
import uploadConfig from './config/upload.config';

@Module({
  imports: [ConfigModule.forFeature(uploadConfig)],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
