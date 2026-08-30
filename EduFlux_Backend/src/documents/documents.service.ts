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
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/enum';
import { RatingService } from 'src/rating/rating.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: MongoRepository<DocumentEntity>,
    private readonly fileUploadService: FileUploadService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly ratingService: RatingService,
  ) {}

  // ─── CREATE ───────────────────────────────────────────
  async create(dto: Partial<DocumentEntity>): Promise<DocumentEntity> {
    const format = (
      dto.fileFormat ||
      dto.fileUrl?.split('.').pop() ||
      ''
    ).toLowerCase();

    if (
      dto.fileKey &&
      dto.fileUrl &&
      ['pdf', 'docx', 'doc', 'image', 'png', 'jpg', 'jpeg', 'webp'].includes(
        format,
      )
    ) {
      const generatedThumbnail =
        dto.resourceType === 'image' && format === 'pdf'
          ? this.fileUploadService.getThumbnailUrl(
              dto.fileKey,
              dto.resourceType,
              dto.fileVersion,
            )
          : await this.fileUploadService.generateDocumentThumbnail(
              dto.fileKey,
              dto.fileUrl,
              dto.resourceType,
              format,
              dto.fileVersion,
            );

      dto.thumbnailUrl = generatedThumbnail ?? undefined;
    }

    const doc = this.documentRepository.create(dto);
    return this.documentRepository.save(doc);
  }

  private attachThumbnailUrls<T extends Record<string, any>>(documents: T[]) {
    return documents.map((doc) => ({
      ...doc,
      thumbnailUrl: doc.thumbnailUrl ?? null,
    }));
  }

  private sanitizePublicDocument(doc: any) {
    const { fileUrl, fileKey, resourceType, fileVersion, ...safeDoc } =
      doc || {};

    return {
      ...safeDoc,
      isLocked: Boolean(doc?.isPremiumOnly),
    };
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async ensureDocumentSearchIndex() {
    const connection = this.documentRepository.manager.connection as any;
    const collection = connection?.db?.collection('documents');

    if (!collection) {
      return;
    }

    await collection.createIndex(
      {
        title: 'text',
        description: 'text',
        subject: 'text',
        category: 'text',
        tags: 'text',
      },
      {
        weights: {
          title: 10,
          tags: 5,
          subject: 3,
          category: 3,
          description: 1,
        },
        name: 'document_search_index',
      },
    );
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
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filter;

    const query: any = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (semester) query.semester = semester;
    if (subject) {
      query.subject = new RegExp(this.escapeRegex(subject), 'i');
    }

    const trimmedSearch = search?.trim();
    let sortOptions: any = {
      [sortBy]: sortOrder?.toLowerCase() === 'asc' ? 1 : -1,
    };

    if (trimmedSearch) {
      if (trimmedSearch.length < 2) {
        query.$or = [
          { title: new RegExp(this.escapeRegex(trimmedSearch), 'i') },
          { subject: new RegExp(this.escapeRegex(trimmedSearch), 'i') },
          { tags: new RegExp(this.escapeRegex(trimmedSearch), 'i') },
          { description: new RegExp(this.escapeRegex(trimmedSearch), 'i') },
        ];
      } else {
        query.$text = { $search: trimmedSearch };
        sortOptions = { score: { $meta: 'textScore' }, ...sortOptions };
      }
    }

    const skip = (page - 1) * limit;

    const collection = this.documentRepository.manager
      .getMongoRepository(DocumentEntity)
      .manager.connection.mongoManager.getMongoRepository(DocumentEntity);

    const [rawDocs, total] = await Promise.all([
      collection.find({
        where: query,
        order: sortOptions,
        skip,
        take: limit,
      }),
      collection.count(query),
    ]);

    const documentIds = rawDocs.map((doc) => String(doc._id));
    const ratingStats = (await this.ratingService.getAverageRatingForDocuments(
      documentIds,
    )) as Array<{
      documentId: string;
      average: number;
      count: number;
    }>;
    const ratingMap = new Map<string, { average: number; count: number }>();

    ratingStats.forEach((item) => {
      ratingMap.set(String(item.documentId), {
        average: Number(item.average || 0),
        count: Number(item.count || 0),
      });
    });

    const data = this.attachThumbnailUrls(
      await Promise.all(
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
              console.error(
                'Failed to populate uploader info for findAll:',
                err,
              );
            }
          }
          const stat = ratingMap.get(String(doc._id));
          return {
            ...doc,
            uploader,
            uploaderAvatar,
            averageRating: stat?.average ?? 0,
            ratingCount: stat?.count ?? 0,
          };
        }),
      ),
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  async findPublic(filter: FilterDocumentDto = {}) {
    const {
      category,
      subject,
      semester,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filter;

    const query: any = {
      status: { $in: [DocumentStatus.APPROVED, DocumentStatus.PUBLISHED] },
    };

    if (category) query.category = category;
    if (semester) query.semester = semester;
    if (subject) query.subject = new RegExp(this.escapeRegex(subject), 'i');

    const trimmedSearch = search?.trim();
    let sortOptions: any = {
      [sortBy]: sortOrder?.toLowerCase() === 'asc' ? 1 : -1,
    };

    if (trimmedSearch) {
      if (trimmedSearch.length < 2) {
        query.$or = [
          { title: new RegExp(this.escapeRegex(trimmedSearch), 'i') },
          { subject: new RegExp(this.escapeRegex(trimmedSearch), 'i') },
          { tags: new RegExp(this.escapeRegex(trimmedSearch), 'i') },
          { description: new RegExp(this.escapeRegex(trimmedSearch), 'i') },
        ];
      } else {
        query.$text = { $search: trimmedSearch };
        sortOptions = { score: { $meta: 'textScore' }, ...sortOptions };
      }
    }

    const skip = (page - 1) * limit;

    const collection = this.documentRepository.manager
      .getMongoRepository(DocumentEntity)
      .manager.connection.mongoManager.getMongoRepository(DocumentEntity);

    const [rawDocs, total] = await Promise.all([
      collection.find({
        where: query,
        order: sortOptions,
        skip,
        take: limit,
      }),
      collection.count(query),
    ]);

    const documentIds = rawDocs.map((doc) => String(doc._id));
    const ratingStats = (await this.ratingService.getAverageRatingForDocuments(
      documentIds,
    )) as Array<{
      documentId: string;
      average: number;
      count: number;
    }>;
    const ratingMap = new Map<string, { average: number; count: number }>();

    ratingStats.forEach((item) => {
      ratingMap.set(String(item.documentId), {
        average: Number(item.average || 0),
        count: Number(item.count || 0),
      });
    });

    const data = this.attachThumbnailUrls(
      await Promise.all(
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
              console.error(
                'Failed to populate uploader info for findPublic:',
                err,
              );
            }
          }

          const stat = ratingMap.get(String(doc._id));
          return {
            ...doc,
            uploader,
            uploaderAvatar,
            averageRating: stat?.average ?? 0,
            ratingCount: stat?.count ?? 0,
          };
        }),
      ),
    ).map((doc) => this.sanitizePublicDocument(doc));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublicById(id: string): Promise<any> {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const doc = await this.documentRepository.findOne({
      where: { _id: new ObjectId(id) },
    });

    if (!doc) throw new NotFoundException('Document not found');

    if (
      ![DocumentStatus.APPROVED, DocumentStatus.PUBLISHED].includes(
        doc.status as DocumentStatus,
      )
    ) {
      throw new NotFoundException('Document not found');
    }

    return this.sanitizePublicDocument(await this.findById(id));
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

    const rating = await this.ratingService.getAverageRating(id);

    return {
      ...doc,
      uploader,
      uploaderAvatar,
      averageRating: rating.average,
      ratingCount: rating.count,
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

      const thumbnailUrl =
        fileFormat?.toLowerCase() === 'pdf'
          ? await this.fileUploadService.generateDocumentThumbnail(
              fileKey,
              fileUrl,
              resourceType,
              fileFormat,
              version,
            )
          : resourceType === 'image'
            ? this.fileUploadService.getThumbnailUrl(
                fileKey,
                resourceType,
                version,
              )
            : null;

      updateData = {
        ...updateData,
        fileKey,
        fileUrl,
        fileFormat,
        resourceType,
        fileVersion: version,
        fileSize: file.size,
        thumbnailUrl: thumbnailUrl ?? undefined,
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

      const thumbnailUrl =
        fileFormat?.toLowerCase() === 'pdf'
          ? await this.fileUploadService.generateDocumentThumbnail(
              fileKey,
              fileUrl,
              resourceType,
              fileFormat,
              version,
            )
          : resourceType === 'image'
            ? this.fileUploadService.getThumbnailUrl(
                fileKey,
                resourceType,
                version,
              )
            : null;

      updateData = {
        ...updateData,
        fileKey,
        fileUrl,
        fileFormat,
        resourceType,
        fileVersion: version,
        fileSize: file.size,
        thumbnailUrl: thumbnailUrl ?? undefined,
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
    const doc = await this.findById(id);

    const result = await this.documentRepository.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    if (doc.userId) {
      if (status === DocumentStatus.APPROVED) {
        await this.notificationService.createNotification({
          userId: doc.userId.toString(),
          type: NotificationType.DOCUMENT_APPROVED,
          title: 'Document Approved',
          message: `Your document "${doc.title}" has been approved and is now live.`,
          link: `/documents/${doc._id}`,
        });

        const user = await this.userService.getUser({
          _id: new ObjectId(doc.userId),
        });

        if (user) {
          const newCount = (user.approvedUploadCount || 0) + 1;
          const updateData: any = { approvedUploadCount: newCount };

          if (newCount % 3 === 0) {
            updateData.unlockCredits = (user.unlockCredits || 0) + 1;
            await this.notificationService.createNotification({
              userId: doc.userId.toString(),
              type: NotificationType.UNLOCK_CREDIT_EARNED,
              title: 'Unlock Credit Earned!',
              message: 'You earned 1 unlock credit for approved uploads.',
            });
          }

          await this.userService.updateUser(doc.userId, updateData);
        }
      } else if (status === DocumentStatus.REJECTED) {
        await this.notificationService.createNotification({
          userId: doc.userId.toString(),
          type: NotificationType.DOCUMENT_REJECTED,
          title: 'Document Rejected',
          message: `Your document "${doc.title}" was not approved.`,
        });
      }
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
