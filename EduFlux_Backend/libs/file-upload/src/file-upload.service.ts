import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import * as path from 'path';
import uploadConfig from './config/upload.config';

type UploadResult = {
  fileKey: string;
  fileUrl: string;
  fileFormat: string;
  resourceType: string;
  contentType?: string;
  version?: string;
};

@Injectable()
export class FileUploadService {
  constructor(
    @Inject(uploadConfig.KEY)
    private readonly config: ConfigType<typeof uploadConfig>,
  ) {
    cloudinary.config({
      cloud_name: this.config.cloudinary.cloudName,
      api_key: this.config.cloudinary.apiKey,
      api_secret: this.config.cloudinary.apiSecret,
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    userId: string,
  ): Promise<UploadResult> {
    const ext = path.extname(fileName);
    const nameWithoutExt = fileName.replace(ext, '').replace(/\s+/g, '_');
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${this.config.cloudinary.folder}/${userId}`,
          resource_type: 'auto',
          public_id: `${Date.now()}-${nameWithoutExt}`,
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              new Error(
                `File upload failed: ${error?.message || 'No upload response from Cloudinary'}`,
              ),
            );
          }

          resolve({
            fileKey: result.public_id,
            fileUrl: result.secure_url,
            fileFormat: result.format || ext.replace(/^\./, ''),
            resourceType: result.resource_type,
            contentType: result.resource_type,
            version: result.version ? String(result.version) : undefined,
          });
        },
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  async deleteFile(fileKey: string): Promise<void> {
    try {
      const tryDestroy = async (resourceType: string) =>
        cloudinary.uploader.destroy(fileKey, { resource_type: resourceType });

      const { result } = await tryDestroy('raw');
      if (result === 'ok' || result === 'not found') {
        return;
      }

      const { result: imageResult } = await tryDestroy('image');
      if (imageResult === 'ok' || imageResult === 'not found') {
        return;
      }

      throw new Error(`Cloudinary deletion failed with result: ${imageResult}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`File deletion failed: ${message}`);
    }
  }

  async createSignedUrl(
    fileKey: string,
    format: string,
    resourceType: string = 'raw',
    version?: string,
    expiresIn = 3600,
  ): Promise<string> {
    try {
      const escapedFormat = format.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const trailingExtPattern = new RegExp(`\\.${escapedFormat}$`, 'i');
      const cleanPublicId = trailingExtPattern.test(fileKey)
        ? fileKey.replace(trailingExtPattern, '')
        : fileKey;

      const signedUrl = cloudinary.url(cleanPublicId, {
        resource_type: resourceType,
        type: 'upload',
        format: resourceType === 'raw' ? undefined : format,
        version: version ? Number(version) : undefined,
        sign_url: true,
        secure: true,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      });

      if (!signedUrl) {
        throw new Error(`Creating signed URL failed: ${fileKey}`);
      }

      return signedUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Creating signed URL failed: ${message}`);
    }
  }
}
