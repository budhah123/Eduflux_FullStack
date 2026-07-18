import { FileUploadService } from '@app/file-upload/file-upload.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAtGuard } from 'src/auth/decorator';
import {
  CreateDocumentInput,
  DocumentsService,
  UpdateDocumentInput,
  UploadDocumentInput,
} from 'src/documents';
import { FilterDocumentDto } from 'src/documents/dto/filter-document.dto';

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

@AdminAtGuard()
@ApiSecurity('JWT-auth')
@ApiBearerAuth()
@ApiTags('Admin Document Management')
@Controller('admin/document')
export class AdminDocumentController {
  constructor(
    private readonly documentService: DocumentsService,
    private uploadService: FileUploadService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Browse all published documents' })
  findAll(@Query() filter: FilterDocumentDto) {
    return this.documentService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single document' })
  findOne(@Param('id') id: string) {
    return this.documentService.findById(id);
  }

  @Post('upload')
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
        req.user.id,
      );
    return this.documentService.create({
      ...body,
      fileKey,
      fileUrl,
      fileFormat,
      resourceType,
      fileVersion: version,
      fileSize: file.size,
      userId: req.user.id,
    } as any);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateDocumentInput })
  @ApiOperation({ summary: 'Update document metadata, optional file replace' })
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
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentInput,
    @UploadedFile() file?: UploadedDocumentFile,
  ) {
    return this.documentService.adminUpdate(id, dto, file);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  delete(@Param('id') id: string) {
    return this.documentService.deleteAsAdmin(id);
  }
  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: change document status' })
  changeStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.documentService.changeStatus(id, status);
  }
}
