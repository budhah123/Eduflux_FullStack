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
import { MailService } from '@app/mail';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAtGuard } from 'src/auth/decorator';
import {
  CreateDocumentInput,
  UpdateDocumentInput,
  UploadDocumentInput,
} from 'src/documents/dto';
import { DocumentsService } from 'src/documents/documents.service';
import { FilterDocumentDto } from 'src/documents/dto/filter-document.dto';
import { ChangeStatusDto } from 'src/documents/dto/change-status.dto';
import { UserService } from 'src/user/user.service';
import { DocumentStatus } from 'src/documents/enum';
import { ObjectId } from 'mongodb';
import { AuditLogService } from 'src/audit-log/audit-log.service';

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
  mimetype: string;
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
    private readonly userService: UserService,
    private readonly auditLogService: AuditLogService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Browse all published documents' })
  findAll(@Query() filter: FilterDocumentDto) {
    return this.documentService.adminFindAll(filter);
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
          file.mimetype,
      );
    return this.documentService.create({
      ...body,
      fileKey,
      fileUrl,
      fileFormat,
      originalFileName: file.originalname,
      contentType: file.mimetype,
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
  async delete(@Param('id') id: string, @Req() req) {
    const doc = await this.documentService.findById(id);
    const result = await this.documentService.deleteAsAdmin(id);

    await this.auditLogService.logAdminAction({
      adminUserId: req.user?._id?.toString?.() ?? req.user?.id ?? 'system',
      action: 'deleted_document',
      targetType: 'document',
      targetId: id,
      targetName: doc.title,
      details: `Admin deleted document ${doc.title}`,
      timestamp: new Date(),
    });

    return result;
  }
  @Patch(':id/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: change document status' })
  @ApiParam({
    name: 'id',
    description: 'Document ID to update status for',
    example: '64b8c9f1e4b0a2d3c4e5f678',
  })
  @ApiBody({ type: ChangeStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Document status updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — admin access required',
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @Req() req,
  ) {
    const existingDoc = await this.documentService.findById(id);
    const updatedDoc = await this.documentService.changeStatus(id, dto.status);
    const adminUserId =
      req.user?._id?.toString?.() ??
      req.user?.id ??
      req.user?.email ??
      'system';

    if (existingDoc.userId) {
      const user = await this.userService.getUser({
        _id: new ObjectId(existingDoc.userId),
      });

      if (dto.status === DocumentStatus.APPROVED && user?.email) {
        await this.mailService.sendDocumentApprovedEmail(
          user.email,
          updatedDoc.title,
        );
      }

      if (dto.status === DocumentStatus.REJECTED && user?.email) {
        await this.mailService.sendDocumentRejectedEmail(
          user.email,
          updatedDoc.title,
        );
      }
    }

    await this.auditLogService.logAdminAction({
      adminUserId,
      action: `${dto.status}_document`,
      targetType: 'document',
      targetId: String(existingDoc._id),
      targetName: existingDoc.title,
      details: `Admin set document status to ${dto.status}`,
      timestamp: new Date(),
    });

    return updatedDoc;
  }
}
