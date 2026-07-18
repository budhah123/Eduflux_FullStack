import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as express from 'express';
import axios, { AxiosResponse } from 'axios';
import { Readable } from 'stream';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { FileUploadService } from '@app/file-upload';
import { FilterDocumentDto } from './dto/filter-document.dto';
import * as path from 'path';
import * as fs from 'fs';
import {
  CreateDocumentInput,
  UpdateDocumentInput,
  UploadDocumentInput,
} from './dto';
import { AtGuard, AdminAtGuard } from '../auth/decorator';

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'text/plain',
]);

const isAllowedUploadMimeType = (mimeType: string) =>
  mimeType.startsWith('image/') || ALLOWED_UPLOAD_MIME_TYPES.has(mimeType);

type UploadedDocumentFile = {
  buffer: Buffer;
  originalname: string;
  size: number;
};

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private documentsService: DocumentsService,
    private uploadService: FileUploadService,
  ) {}

  // PUBLIC
  @Get()
  @ApiOperation({ summary: 'Browse all published documents' })
  findAll(@Query() filter: FilterDocumentDto) {
    return this.documentsService.findAll(filter);
  }

  // PROTECTED — named sub-routes must come BEFORE :id param routes
  @Get('user/my-uploads')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my uploaded documents' })
  myUploads(
    @Query() filter: FilterDocumentDto,
    @Req() req: { user: { _id: string } },
  ) {
    return this.documentsService.findMyUploads(req.user._id, filter);
  }

  @Get('/view/:id')
  @ApiOperation({ summary: 'View document' })
  async viewFile(@Param('id') id: string, @Res() res: express.Response) {
    const document = await this.findOne(id);
    if (!document) {
      throw new NotFoundException(`Document with id: ${id} not found`);
    }

    const isRemote =
      document.fileUrl.startsWith('http://') ||
      document.fileUrl.startsWith('https://');

    if (isRemote) {
      try {
        const format =
          document.fileFormat || document.fileUrl.split('.').pop() || 'pdf';
        const signedUrl = await this.uploadService.createSignedUrl(
          document.fileKey,
          format,
          document.resourceType || 'raw',
          document.fileVersion,
        );

        const response: AxiosResponse = await axios({
          method: 'get',
          url: signedUrl,
          responseType: 'stream',
        });

        const extension = `.${format.toLowerCase()}`;

        const mimeTypes: Record<string, string> = {
          '.pdf': 'application/pdf',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
          '.txt': 'text/plain',
          '.html': 'text/html',
          '.docx':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.doc': 'application/msword',
          '.xlsx':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '.xls': 'application/vnd.ms-excel',
          '.pptx':
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          '.ppt': 'application/vnd.ms-powerpoint',
        };

        const contentType =
          mimeTypes[extension] ||
          (response.headers['content-type'] as string | undefined) ||
          'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'inline');
        (response.data as Readable).pipe(res);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Failed to stream remote document:', message);
        return res.redirect(document.fileUrl);
      }
    }

    const filePath = path.isAbsolute(document.fileUrl)
      ? document.fileUrl
      : path.join(process.cwd(), document.fileUrl);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File not found at: ${filePath}`);
    }

    const extension = path.extname(document.fileUrl).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.pptx':
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.ppt': 'application/vnd.ms-powerpoint',
    };

    const contentType = mimeTypes[extension] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.sendFile(filePath);
  }

  @Get(':id/preview-url')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get preview URL without incrementing download count',
  })
  async previewUrl(@Param('id') id: string) {
    const doc = await this.documentsService.findById(id);
    const format = doc.fileFormat || doc.fileUrl.split('.').pop() || 'pdf';
    const url = await this.uploadService.createSignedUrl(
      doc.fileKey,
      format,
      doc.resourceType || 'raw',
      doc.fileVersion,
    );

    return { url };
  }

  @Get(':id/download')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get download URL + increment count' })
  async download(@Param('id') id: string) {
    const doc = await this.documentsService.findById(id);
    await this.documentsService.incrementDownload(id);
    const format = doc.fileFormat || doc.fileUrl.split('.').pop() || 'pdf';
    const signedUrl = await this.uploadService.createSignedUrl(
      doc.fileKey,
      format,
      doc.resourceType || 'raw',
      doc.fileVersion,
    );
    return { url: signedUrl };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single document' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }

  @Post('upload')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDocumentInput })
  @ApiOperation({ summary: 'Upload document file' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        isAllowedUploadMimeType(file.mimetype)
          ? cb(null, true)
          : cb(
              new Error('Only documents, PDFs, and images are allowed'),
              false,
            );
      },
    }),
  )
  async upload(
    @UploadedFile() file: UploadedDocumentFile,
    @Body() body: CreateDocumentInput,
    @Req() req,
  ) {
    const { fileKey, fileUrl, fileFormat, resourceType, version } =
      await this.uploadService.uploadFile(
        file.buffer,
        file.originalname,
        req.user._id,
      );
    return this.documentsService.create({
      ...body,
      fileKey,
      fileUrl,
      fileFormat,
      resourceType,
      fileVersion: version,
      fileSize: file.size,
      userId: req.user._id,
    } as any);
  }

  @Patch(':id')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update document metadata' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentInput,
    @Req() req,
  ) {
    return this.documentsService.update(id, dto, req.user.id);
  }
  @Delete(':id')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete document' })
  delete(@Param('id') id: string, @Req() req) {
    return this.documentsService.deleteOwn(id, req.user._id);
  }
  @Patch(':id/status')
  @AdminAtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: change document status' })
  changeStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.documentsService.changeStatus(id, status);
  }
}
