import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FindOptionsOrder, FindOptionsWhere, MongoRepository } from 'typeorm';
import { DocumentEntity } from './entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FileUploadService } from '@app/file-upload';
import { PaginationInput } from 'src/common/pagination';
import { CreateDocumentInput, UpdateDocumentInput } from './dto';
import { FilterDocumentDto } from './dto/filter-document.dto';
import { ObjectId } from 'mongodb';
import { UserService } from '../user/user.service';
import { DocumentStatus } from './enum';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: MongoRepository<DocumentEntity>,
    private readonly fileUploadService: FileUploadService,
    private readonly userService: UserService,
  ) {}

  // ─── CREATE ───────────────────────────────────────────
  async create(dto: Partial<DocumentEntity>): Promise<DocumentEntity> {
    const doc = this.documentRepository.create(dto);
    return this.documentRepository.save(doc);
  }

  // ─── GET ALL (filter + pagination) ────────────────────
  async findAll(filter: FilterDocumentDto) {
    const {
      category,
      subject,
      semester,
      search,
      status,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filter;

    // Build native MongoDB query — TypeORM's findAndCount does NOT support
    // $or / RegExp operators on MongoDB; use the native collection directly.
    const query: any = {};

    // Only filter by status when explicitly provided (avoids filtering out
    // documents that were saved without a status field, or with a different value)
    if (status) query.status = status;
    if (category) query.category = category;
    if (semester) query.semester = semester;
    if (subject) query.subject = new RegExp(subject, 'i');

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') },
      ];
    }

    const sortDirection = sortOrder?.toLowerCase() === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const collection = this.documentRepository.manager
      .getMongoRepository(DocumentEntity)
      .manager.connection.mongoManager.getMongoRepository(DocumentEntity);

    const [rawDocs, total] = await Promise.all([
      collection.find({
        where: query,
        order: { [sortBy]: sortDirection },
        skip,
        take: limit,
      }),
      collection.count(query),
    ]);

    const data = await Promise.all(
      rawDocs.map(async (doc) => {
        let uploader = 'System User';
        let uploaderAvatar = '';
        if (doc.userId) {
          try {
            const user = await this.userService.getUser({
              _id: new ObjectId(doc.userId),
            });
            if (user) {
              uploader =
                `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                user.email ||
                'System User';
              uploaderAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(uploader)}&background=3525cd&color=fff`;
            }
          } catch (err) {
            console.error('Failed to populate uploader info for findAll:', err);
          }
        }
        return {
          ...doc,
          uploader,
          uploaderAvatar,
        };
      }),
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── GET ONE ──────────────────────────────────────────
  async findById(id: string): Promise<any> {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }
    const doc = await this.documentRepository.findOne({
      where: { _id: new ObjectId(id) },
    });
    if (!doc) throw new NotFoundException('Document not found');

    let uploader = 'System User';
    let uploaderAvatar = '';

    if (doc.userId) {
      try {
        const user = await this.userService.getUser({
          _id: new ObjectId(doc.userId),
        });
        if (user) {
          uploader =
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            user.email ||
            'System User';
          uploaderAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(uploader)}&background=3525cd&color=fff`;
        }
      } catch (err) {
        console.error('Failed to populate uploader info:', err);
      }
    }

    return {
      ...doc,
      uploader,
      uploaderAvatar,
    };
  }

  async getDocument(whereParams: FindOptionsWhere<DocumentEntity>) {
    return this.documentRepository.findOne({ where: whereParams });
  }

  // ─── MY UPLOADS ───────────────────────────────────────
  async findMyUploads(userId: string, filter: FilterDocumentDto) {
    const { page = 1, limit = 12, status } = filter;
    const where: any = { userId };
    if (status) where.status = status;

    const [data, total] = await this.documentRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── UPDATE ───────────────────────────────────────────
  async update(
    id: string,
    dto: UpdateDocumentInput,
    userId: string,
    file?: { buffer: Buffer; originalname: string; size: number },
  ): Promise<DocumentEntity> {
    const doc = await this.findById(id);

    if (String(doc.userId) !== String(userId)) {
      throw new ForbiddenException('Not your document');
    }

    let updateData: any = { ...dto };

    if (file) {
      // remove old file from cloudinary first
      if (doc.fileKey) {
        await this.fileUploadService.deleteFile(doc.fileKey);
      }

      const { fileKey, fileUrl, fileFormat, resourceType, version } =
        await this.fileUploadService.uploadFile(
          file.buffer,
          file.originalname,
          userId,
        );

      updateData = {
        ...updateData,
        fileKey,
        fileUrl,
        fileFormat,
        resourceType,
        fileVersion: version,
        fileSize: file.size,
      };
    }

    await this.documentRepository.update({ _id: new ObjectId(id) }, updateData);
    return this.findById(id);
  }

  // ─── ADMIN UPDATE (no ownership check) ─────────────────
  async adminUpdate(
    id: string,
    dto: UpdateDocumentInput,
    file?: { buffer: Buffer; originalname: string; size: number },
  ): Promise<DocumentEntity> {
    const doc = await this.findById(id);

    let updateData: any = { ...dto };

    if (file) {
      if (doc.fileKey) {
        await this.fileUploadService.deleteFile(doc.fileKey);
      }

      const { fileKey, fileUrl, fileFormat, resourceType, version } =
        await this.fileUploadService.uploadFile(
          file.buffer,
          file.originalname,
          String(doc.userId),
        );

      updateData = {
        ...updateData,
        fileKey,
        fileUrl,
        fileFormat,
        resourceType,
        fileVersion: version,
        fileSize: file.size,
      };
    }

    await this.documentRepository.update({ _id: new ObjectId(id) }, updateData);
    return this.findById(id);
  }

  // ─── USER DELETE (own document only) ───
  async deleteOwn(id: string, userId: string): Promise<{ message: string }> {
    const doc = await this.findById(id);

    if (String(doc.userId) !== String(userId)) {
      throw new ForbiddenException(
        'You are not allowed to delete this document',
      );
    }

    await this.removeFileAndRecord(doc, id);
    return { message: `Document with id ${id} deleted successfully` };
  }

  // ─── ADMIN DELETE (any document) ───
  async deleteAsAdmin(id: string): Promise<{ message: string }> {
    const doc = await this.findById(id);

    await this.removeFileAndRecord(doc, id);
    return { message: `Document with id ${id} deleted successfully` };
  }

  // ─── INCREMENT DOWNLOAD ───────────────────────────────
  async incrementDownload(id: string): Promise<void> {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }
    await this.incrementCounter(id, 'downloadCount', 1);
  }

  // ─── INCREMENT BOOKMARK ───────────────────────────────
  async incrementBookmark(id: string, value: 1 | -1): Promise<void> {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }
    await this.incrementCounter(id, 'bookmarkCount', value);
  }

  private async incrementCounter(
    id: string,
    field: 'downloadCount' | 'bookmarkCount',
    value: number,
  ): Promise<void> {
    await this.documentRepository.updateOne({ _id: new ObjectId(id) }, [
      {
        $set: {
          [field]: {
            $add: [{ $ifNull: [`$${field}`, 0] }, value],
          },
        },
      },
    ] as any);
  }

  // ─── ADMIN: change status ─────────────────────────────
  async changeStatus(
    id: string,
    status: DocumentStatus,
  ): Promise<DocumentEntity> {
    const result = await this.documentRepository.update(
      { _id: new ObjectId(id) },
      { status },
    );
    if (result.affected === 0) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    return this.findById(id);
  }

  // ─── ADMIN: all docs ──────────────────────────────────
  async adminFindAll(filter: FilterDocumentDto) {
    return this.findAll({ ...filter, status: undefined });
  }

  // ─── shared cleanup logic ───
  private async removeFileAndRecord(doc: any, id: string) {
    try {
      await this.fileUploadService.deleteFile(doc.fileKey);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to delete file from storage: ${message}`,
      );
    }

    await this.documentRepository.delete({ _id: new ObjectId(id) });
  }
}
