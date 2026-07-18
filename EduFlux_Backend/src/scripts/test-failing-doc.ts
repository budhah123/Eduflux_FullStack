import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FileUploadService } from '@app/file-upload';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const fileUploadService = app.get(FileUploadService);

  const fileKey = 'eduflux/docs/6a2fedc97c2222c098955435/1783067610179-Trigger_Questions';
  const format = 'docx';
  const resourceType = 'raw';
  const version = '1783067615';

  const signedUrl = await fileUploadService.createSignedUrl(
    fileKey,
    format,
    resourceType,
    version,
  );

  console.log('\n--- Generated Signed URL Test ---');
  console.log(`Original fileKey: ${fileKey}`);
  console.log(`Format: ${format}`);
  console.log(`ResourceType: ${resourceType}`);
  console.log(`Version: ${version}`);
  console.log(`Generated Signed URL: ${signedUrl}`);
  console.log('---------------------------------\n');

  await app.close();
}

run();
