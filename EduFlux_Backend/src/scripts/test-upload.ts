// import * as fs from 'fs';
// import * as path from 'path';
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from '../app.module';
// import { FileUploadService } from '@app/file-upload';
// import { DocumentsService } from '../documents/documents.service';

// // Minimal 1x1 pixel transparent PNG
// const PNG_HEX = '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789cc107000002000183b3e2a50000000049454e44ae426082';
// const pngBuffer = Buffer.from(PNG_HEX, 'hex');

// async function run() {
//   console.log('Bootstrapping NestJS application context...');
//   const app = await NestFactory.createApplicationContext(AppModule);
//   console.log('NestJS context booted successfully.');

//   const fileUploadService = app.get(FileUploadService);
//   const documentsService = app.get(DocumentsService);

//   const testUserId = '6a2fedc97c2222c098955435'; // A valid user ID from existing docs

//   // Test Case 1: Image Upload (PNG)
//   console.log('\n--- Test Case 1: Uploading PNG Image ---');
//   try {
//     const uploadResult = await fileUploadService.uploadFile(
//       pngBuffer,
//       'test_image.png',
//       testUserId,
//     );

//     console.log('Upload Result for PNG:');
//     console.log(JSON.stringify(uploadResult, null, 2));

//     const createdDoc = await documentsService.create({
//       title: 'Integration Test Image',
//       description: 'Uploaded by automated test',
//       category: 'Test',
//       fileKey: uploadResult.fileKey,
//       fileUrl: uploadResult.fileUrl,
//       fileFormat: uploadResult.fileFormat,
//       resourceType: uploadResult.resourceType,
//       fileVersion: uploadResult.version,
//       fileSize: pngBuffer.length,
//       userId: testUserId,
//     } as any);

//     console.log('Created Document in Database for PNG:');
//     console.log({
//       _id: createdDoc._id,
//       title: createdDoc.title,
//       resourceType: createdDoc.resourceType,
//       fileVersion: createdDoc.fileVersion,
//     });

//     if (createdDoc.resourceType === 'image') {
//       console.log('SUCCESS: resourceType is correctly resolved to "image" for PNG.');
//     } else {
//       console.error(`ERROR: resourceType was resolved to "${createdDoc.resourceType}" instead of "image".`);
//     }

//     console.log('Generating signed URL for PNG...');
//     const signedUrlPng = await fileUploadService.createSignedUrl(
//       createdDoc.fileKey,
//       createdDoc.fileFormat || 'png',
//       createdDoc.resourceType,
//       createdDoc.fileVersion,
//     );
//     console.log(`Generated Signed URL for PNG: ${signedUrlPng}`);

//     // Cleanup PNG
//     await documentsService.delete(String(createdDoc._id), testUserId, true);
//     console.log('Cleanup for PNG completed.');
//   } catch (error) {
//     console.error('PNG Test failed:', error);
//   }

//   // Test Case 2: Raw Upload (TXT)
//   console.log('\n--- Test Case 2: Uploading TXT File ---');
//   try {
//     const txtBuffer = Buffer.from('this is a raw text file');
//     const uploadResult = await fileUploadService.uploadFile(
//       txtBuffer,
//       'test_file.txt',
//       testUserId,
//     );

//     console.log('Upload Result for TXT:');
//     console.log(JSON.stringify(uploadResult, null, 2));

//     const createdDoc = await documentsService.create({
//       title: 'Integration Test TXT',
//       description: 'Uploaded by automated test',
//       category: 'Test',
//       fileKey: uploadResult.fileKey,
//       fileUrl: uploadResult.fileUrl,
//       fileFormat: uploadResult.fileFormat,
//       resourceType: uploadResult.resourceType,
//       fileVersion: uploadResult.version,
//       fileSize: txtBuffer.length,
//       userId: testUserId,
//     } as any);

//     console.log('Created Document in Database for TXT:');
//     console.log({
//       _id: createdDoc._id,
//       title: createdDoc.title,
//       resourceType: createdDoc.resourceType,
//       fileVersion: createdDoc.fileVersion,
//     });

//     if (createdDoc.resourceType === 'raw') {
//       console.log('SUCCESS: resourceType is correctly resolved to "raw" for TXT.');
//     } else {
//       console.error(`ERROR: resourceType was resolved to "${createdDoc.resourceType}" instead of "raw".`);
//     }

//     console.log('Generating signed URL for TXT...');
//     const signedUrlTxt = await fileUploadService.createSignedUrl(
//       createdDoc.fileKey,
//       createdDoc.fileFormat || 'txt',
//       createdDoc.resourceType,
//       createdDoc.fileVersion,
//     );
//     console.log(`Generated Signed URL for TXT: ${signedUrlTxt}`);

//     // Cleanup TXT
//     await documentsService.delete(String(createdDoc._id), testUserId, true);
//     console.log('Cleanup for TXT completed.');
//   } catch (error) {
//     console.error('TXT Test failed:', error);
//   }

//   await app.close();
//   console.log('\nNestJS application context closed.');
// }

// run();
