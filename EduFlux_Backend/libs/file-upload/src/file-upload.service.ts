import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import * as path from 'path';
import uploadConfig from './config/upload.config';

type UploadResult = {
  fileKey: string;
  fileUrl: string;
  fileFormat: string;
  resourceType: string;
  contentType: string;
  version?: string;
};

const MIME_TYPES_BY_FORMAT: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  rtf: 'application/rtf',
  txt: 'text/plain',
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
    mimeType?: string,
  ): Promise<UploadResult> {
    const ext = path.extname(fileName);
    const format = ext.replace(/^\./, '').toLowerCase();
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
            fileFormat: result.format || format,
            resourceType: result.resource_type,
            contentType: mimeType || MIME_TYPES_BY_FORMAT[format] || 'application/octet-stream',
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
    filename?: string,
  ): Promise<string> {
    try {
      const isRaw = resourceType === 'raw';

      // For raw resources in Cloudinary, fileKey is the exact public_id.
      // Cloudinary does not perform dynamic format transformations on raw assets;
      // passing `format` appends an unwanted extension to the URL path which breaks
      // the lookup with a 404.
      // For image resources (e.g. PDF rendered as images), Cloudinary requires format.
      let cleanPublicId = fileKey;
      let targetFormat: string | undefined = undefined;

      if (!isRaw) {
        const escapedFormat = format.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const trailingExtPattern = new RegExp(`\\.${escapedFormat}$`, 'i');
        cleanPublicId = trailingExtPattern.test(fileKey)
          ? fileKey.replace(trailingExtPattern, '')
          : fileKey;
        targetFormat = format.toLowerCase();
      }

      const signedUrl = cloudinary.url(cleanPublicId, {
        resource_type: resourceType,
        type: 'upload',
        format: targetFormat,
        version: version ? Number(version) : undefined,
        secure: true,
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

  getThumbnailUrl(
    fileKey: string,
    resourceType: string,
    version?: string,
  ): string | null {
    if (!fileKey) return null;

    const safeResourceType =
      resourceType === 'raw' ? 'image' : resourceType || 'image';

    return cloudinary.url(fileKey, {
      resource_type: safeResourceType,
      type: 'upload',
      version: version ? Number(version) : undefined,
      transformation: [
        {
          page: 1,
          format: 'jpg',
          width: 400,
          crop: 'fill',
          quality: 'auto',
          density: 150,
        },
      ],
      secure: true,
    });
  }

  async generateDocumentThumbnail(
    fileKey: string,
    fileUrl: string,
    resourceType?: string,
    fileFormat?: string,
    version?: string,
  ): Promise<string | null> {
    if (!fileKey || !fileUrl) return null;

    const normalizedFormat = (
      fileFormat ||
      fileUrl.split('.').pop() ||
      ''
    ).toLowerCase();

    if (resourceType === 'image') {
      return this.getThumbnailUrl(fileKey, resourceType, version) ?? null;
    }

    if (normalizedFormat === 'pdf') {
      try {
        const response = await axios.get(fileUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
        });

        const pdfBuffer = Buffer.isBuffer(response.data)
          ? response.data
          : Buffer.from(response.data);

        const pdfModule = await import('pdf-to-img');
        const pdfRenderer = (pdfModule as any).default ?? (pdfModule as any);
        const doc = await pdfRenderer(pdfBuffer, {
          format: 'jpg',
          scale: 1.5,
        });

        const pageBuffer = await doc.getPage(1);
        await doc.destroy();

        const thumbPublicId = `${fileKey}-thumb`;
        const thumbUrl = await this.uploadGeneratedImage(
          pageBuffer,
          thumbPublicId,
        );
        return thumbUrl;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `Failed to generate thumbnail for raw PDF ${fileKey}:`,
          message,
        );
        return null;
      }
    }

    if (['docx', 'doc'].includes(normalizedFormat)) {
      return this.generateDocxThumbnail(fileKey, fileUrl);
    }

    return null;
  }

  async generateDocxThumbnail(
    fileKey: string,
    fileUrl: string,
  ): Promise<string | null> {
    if (!fileKey || !fileUrl) return null;

    try {
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const docxBuffer = Buffer.isBuffer(response.data)
        ? response.data
        : Buffer.from(response.data);

      const mammoth = await import('mammoth');
      const textResult = await mammoth.extractRawText({ buffer: docxBuffer });
      const rawText = textResult.value || '';

      const svg = this.buildDocxSvg(rawText);
      const cleanPublicId = fileKey.replace(/\.[^.]+$/, '');
      const thumbPublicId = `${cleanPublicId}-thumb`;

      const uploadResult = await cloudinary.uploader.upload(
        `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
        {
          resource_type: 'image',
          public_id: thumbPublicId,
          format: 'jpg',
          overwrite: true,
          transformation: [{ width: 400, crop: 'fill', quality: 'auto' }],
        },
      );

      return uploadResult.secure_url || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `Failed to generate thumbnail for DOCX ${fileKey}:`,
        message,
      );
      return null;
    }
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case "'":
          return '&apos;';
        case '"':
          return '&quot;';
        default:
          return c;
      }
    });
  }

  private buildDocxSvg(text: string, title?: string): string {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const docTitle = this.escapeXml(
      (title || lines[0] || 'Document Preview').slice(0, 60),
    );
    const subHeading =
      lines.length > 1 ? this.escapeXml(lines[1].slice(0, 70)) : '';

    const bodyParagraphs: string[] = [];
    const startIdx = lines.length > 2 ? 2 : lines.length > 1 ? 1 : 0;
    for (let i = startIdx; i < Math.min(lines.length, startIdx + 10); i++) {
      let remaining = lines[i];
      while (remaining.length > 0 && bodyParagraphs.length < 16) {
        const chunk = remaining.slice(0, 65);
        bodyParagraphs.push(this.escapeXml(chunk));
        remaining = remaining.slice(65);
      }
    }

    const renderedLines = bodyParagraphs
      .map((line, idx) => {
        const y = 210 + idx * 22;
        return `<text x="60" y="${y}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" fill="#334155">${line}</text>`;
      })
      .join('\n    ');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <rect width="600" height="800" fill="#f8fafc"/>
    <rect x="30" y="25" width="540" height="750" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" rx="8"/>
    <rect x="30" y="25" width="540" height="10" fill="#2563eb" rx="4"/>
    
    <rect x="60" y="60" width="65" height="24" rx="5" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
    <text x="72" y="76" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#2563eb">DOCX</text>
    
    <text x="60" y="120" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#0f172a">${docTitle}</text>
    ${subHeading ? `<text x="60" y="148" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#475569">${subHeading}</text>` : ''}
    <line x1="60" y1="170" x2="540" y2="170" stroke="#e2e8f0" stroke-width="1.5"/>
    
    ${renderedLines}
    
    <rect x="60" y="620" width="480" height="8" rx="3" fill="#f1f5f9"/>
    <rect x="60" y="640" width="430" height="8" rx="3" fill="#f1f5f9"/>
    <rect x="60" y="660" width="460" height="8" rx="3" fill="#f1f5f9"/>
    
    <line x1="60" y1="720" x2="540" y2="720" stroke="#f1f5f9" stroke-width="1"/>
    <text x="60" y="742" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#94a3b8">Page 1 • Document Preview</text>
  </svg>`;
  }

  private async uploadGeneratedImage(
    imageBuffer: Buffer,
    publicId: string,
  ): Promise<string | null> {
    try {
      const result = await new Promise<{ secure_url?: string }>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: this.config.cloudinary.folder,
              resource_type: 'image',
              public_id: publicId,
              overwrite: true,
              transformation: [{ width: 400, height: 400, crop: 'fill' }],
            },
            (error, result) => {
              if (error || !result) {
                reject(
                  new Error(
                    `Thumbnail upload failed: ${error?.message || 'No upload response from Cloudinary'}`,
                  ),
                );
                return;
              }

              resolve({ secure_url: result.secure_url });
            },
          );

          streamifier.createReadStream(imageBuffer).pipe(uploadStream);
        },
      );

      return result.secure_url ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `Failed to upload generated thumbnail ${publicId}:`,
        message,
      );
      return null;
    }
  }
}
