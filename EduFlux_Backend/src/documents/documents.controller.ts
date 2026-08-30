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
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import {
  CreateDocumentInput,
  UpdateDocumentInput,
  UploadDocumentInput,
} from './dto';
import { AtGuard, AdminAtGuard } from '../auth/decorator';
import { AccessService } from '@app/access';

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
    private accessService: AccessService,
  ) {}

  // PUBLIC — browse list, only approved documents are visible to guests
  @Get('public')
  @ApiOperation({ summary: 'Browse approved documents for guests' })
  async findPublic(@Query() filter: FilterDocumentDto) {
    return this.documentsService.findPublic(filter);
  }

  @Get('public-showcase')
  @ApiOperation({ summary: 'Homepage document showcase for guests' })
  async findPublicShowcase(@Query() filter: FilterDocumentDto) {
    return this.documentsService.findPublic({
      ...filter,
      limit: filter?.limit || 8,
      page: filter?.page || 1,
    });
  }

  @Get('public/:id')
  @ApiOperation({
    summary: 'Get guest-safe document metadata without protected file info',
  })
  async findPublicById(@Param('id') id: string) {
    return this.documentsService.findPublicById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Browse all published documents' })
  async findAll(@Query() filter: FilterDocumentDto) {
    return this.documentsService.findAll(filter);
  }

  // PROTECTED — named sub-routes must come BEFORE :id param routes
  @Get('user/my-uploads')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my uploaded documents' })
  async myUploads(
    @Query() filter: FilterDocumentDto,
    @Req() req: { user: { _id: string } },
  ) {
    return this.documentsService.findMyUploads(req.user._id, filter);
  }

  @Get(':id/preview-url')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get preview URL without incrementing download count',
  })
  async previewUrl(@Param('id') id: string, @Req() req) {
    const doc = await this.documentsService.findById(id);
    if (!doc) throw new NotFoundException(`Document with id: ${id} not found`);

    if (doc.isPremiumOnly) {
      const result = await this.accessService.checkAccess(req.user);
      if (!result.access) {
        throw new ForbiddenException('Unlock this document to preview it');
      }
    }

    const format = doc.fileFormat || doc.fileUrl.split('.').pop() || 'pdf';
    if (!doc.resourceType) {
      throw new InternalServerErrorException(
        `Document ${doc._id} is missing resourceType — run fix-resource-types.ts`,
      );
    }
    const url = await this.uploadService.createSignedUrl(
      doc.fileKey,
      format,
      doc.resourceType,
      doc.fileVersion,
    );

    return { url };
  }

  @Get(':id/download')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get download URL + increment count' })
  async download(@Param('id') id: string, @Req() req) {
    const doc = await this.documentsService.findById(id);
    if (!doc) throw new NotFoundException(`Document with id: ${id} not found`);

    if (doc.isPremiumOnly) {
      const result = await this.accessService.checkAccess(req.user);
      if (!result.access) {
        throw new ForbiddenException(
          'Subscribe via Khalti/eSewa or upload 3 documents to unlock this document',
        );
      }
    }

    const format = doc.fileFormat || doc.fileUrl.split('.').pop() || 'pdf';
    if (!doc.resourceType) {
      throw new InternalServerErrorException(
        `Document ${doc._id} is missing resourceType — run fix-resource-types.ts`,
      );
    }
    await this.documentsService.incrementDownload(id);
    const signedUrl = await this.uploadService.createSignedUrl(
      doc.fileKey,
      format,
      doc.resourceType,
      doc.fileVersion,
    );
    return { url: signedUrl };
  }

  // PROTECTED now — needed so req.user available for isLocked check
  @Get(':id')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get single document' })
  async findOne(@Param('id') id: string, @Req() req) {
    const doc = await this.documentsService.findById(id);
    if (!doc) throw new NotFoundException(`Document with id: ${id} not found`);

    if (!doc.isPremiumOnly) {
      return { ...doc, isLocked: false };
    }

    const result = await this.accessService.checkAccess(req.user);

    if (result.access) {
      return { ...doc, isLocked: false, unlockedVia: result.reason };
    }

    return {
      id: doc._id,
      title: doc.title,
      isLocked: true,
      approvedUploadCount: req.user.approvedUploadCount,
      message: 'Subscribe via Khalti/eSewa or upload 3 documents to unlock',
    };
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
}
