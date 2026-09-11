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
import { UserType } from '../user/enum';
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

    // Determine approval status:
    // Admin uploads are automatically approved without needing a separate approval step.
    let initialStatus = dto.status;
    if (!initialStatus && dto.userId) {
      try {
        const uploader = await this.userService.getUser({
          _id: ObjectId.isValid(dto.userId)
            ? new ObjectId(dto.userId)
            : dto.userId,
        });
        if (uploader?.userType === UserType.ADMIN) {
          initialStatus = DocumentStatus.APPROVED;
        }
      } catch (err) {
        console.warn('Could not check uploader role for auto-approval:', err);
      }
    }
    if (!initialStatus) {
      initialStatus = DocumentStatus.PENDING;
    }

    // Enforce max 4 featured documents for homepage
    if (dto.isHomePage) {
      const collection = this.documentRepository.manager
        .getMongoRepository(DocumentEntity)
        .manager.connection.mongoManager.getMongoRepository(DocumentEntity);
      const currentFeaturedCount = await collection.count({
        isHomePage: true,
      });
      if (currentFeaturedCount >= 4) {
        throw new BadRequestException(
          'A maximum of 4 documents can be featured on the homepage at the same time. Please unfeature another document first.',
        );
      }
    }

    const doc = this.documentRepository.create({
      ...dto,
      status: initialStatus,
      isHomePage: Boolean(dto.isHomePage),
    });
    const savedDoc = await this.documentRepository.save(doc);

    if (savedDoc.userId) {
      try {
        await this.userService.reconcileUploadCredits(
          savedDoc.userId.toString(),
        );
      } catch (err) {
        console.error('Failed to reconcile upload credits on create:', err);
      }
    }

    return savedDoc;
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

    const isHomepageFeatured = Boolean(doc?.isHomePage);
    return {
      ...safeDoc,
      isLocked: isHomepageFeatured ? false : Boolean(doc?.isPremiumOnly),
      isHomePage: isHomepageFeatured,
    };
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private buildRegexSearchQuery(searchTerm: string) {
    const regex = new RegExp(this.escapeRegex(searchTerm), 'i');

    return {
      $or: [
        { title: regex },
        { subject: regex },
        { tags: regex },
        { description: regex },
      ],
    };
  }

  private textIndexReady = false;

  async ensureDocumentSearchIndex() {
    const connection = this.documentRepository.manager.connection as any;
    const collection = connection?.db?.collection('documents');

    if (!collection) {
      return;
    }

    try {
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
      this.textIndexReady = true;
    } catch (error) {
      console.warn(
        'Could not create text search index — falling back to regex search:',
        error,
      );
      this.textIndexReady = false;
    }
  }

  // ─── GET ALL (filter + pagination) ────────────────────
  async findAll(filter: FilterDocumentDto, requireApproved = true) {
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
    if (status) {
      query.status = status;
    } else if (requireApproved) {
      query.status = {
        $in: [DocumentStatus.APPROVED, DocumentStatus.PUBLISHED],
      };
    }
    if (category) query.category = category;
    if (semester) query.semester = semester;
    if (subject) {
      query.subject = new RegExp(this.escapeRegex(subject), 'i');
    }
    if (filter.isHomePage !== undefined) {
      query.isHomePage = filter.isHomePage;
    }

    const trimmedSearch = search?.trim();
    const sortOptions: any = {
      [sortBy]: sortOrder?.toLowerCase() === 'asc' ? 1 : -1,
    };

    if (trimmedSearch) {
      if (this.textIndexReady) {
        query.$text = { $search: trimmedSearch };
      } else {
        const regexQuery = this.buildRegexSearchQuery(trimmedSearch);
        query.$or = regexQuery.$or;
      }
    }

    const skip = (page - 1) * limit;

    const collection = this.documentRepository.manager
      .getMongoRepository(DocumentEntity)
      .manager.connection.mongoManager.getMongoRepository(DocumentEntity);

    let rawDocs: any[];
    let total: number;

    try {
      [rawDocs, total] = await Promise.all([
        collection.find({
          where: query,
          order: sortOptions,
          skip,
          take: limit,
        }),
        collection.count(query),
      ]);
    } catch (error: any) {
      if (error?.code === 27 && trimmedSearch) {
        this.textIndexReady = false;
        delete query.$text;
        const regexQuery = this.buildRegexSearchQuery(trimmedSearch);
        query.$or = regexQuery.$or;

        [rawDocs, total] = await Promise.all([
          collection.find({
            where: query,
            order: sortOptions,
            skip,
            take: limit,
          }),
          collection.count(query),
        ]);
      } else {
        throw error;
      }
    }

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
    if (filter.isHomePage !== undefined) {
      query.isHomePage = filter.isHomePage;
    }

    const trimmedSearch = search?.trim();
    const sortOptions: any = {
      [sortBy]: sortOrder?.toLowerCase() === 'asc' ? 1 : -1,
    };

    if (trimmedSearch) {
      if (this.textIndexReady) {
        query.$text = { $search: trimmedSearch };
      } else {
        const regexQuery = this.buildRegexSearchQuery(trimmedSearch);
        query.$or = regexQuery.$or;
      }
    }

    const skip = (page - 1) * limit;

    const collection = this.documentRepository.manager
      .getMongoRepository(DocumentEntity)
      .manager.connection.mongoManager.getMongoRepository(DocumentEntity);

    let rawDocs: any[];
    let total: number;

    try {
      [rawDocs, total] = await Promise.all([
        collection.find({
          where: query,
          order: sortOptions,
          skip,
          take: limit,
        }),
        collection.count(query),
      ]);
    } catch (error: any) {
      if (error?.code === 27 && trimmedSearch) {
        this.textIndexReady = false;
        delete query.$text;
        const regexQuery = this.buildRegexSearchQuery(trimmedSearch);
        query.$or = regexQuery.$or;

        [rawDocs, total] = await Promise.all([
          collection.find({
            where: query,
            order: sortOptions,
            skip,
            take: limit,
          }),
          collection.count(query),
        ]);
      } else {
        throw error;
      }
    }

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
    file?: {
      buffer: Buffer;
      originalname: string;
      mimetype?: string;
      size: number;
    },
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
          file.mimetype,
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
        originalFileName: file.originalname,
        contentType: file.mimetype,
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
    file?: {
      buffer: Buffer;
      originalname: string;
      mimetype?: string;
      size: number;
    },
  ): Promise<DocumentEntity> {
    const doc = await this.findById(id);

    if (dto.isHomePage === true) {
      const collection = this.documentRepository.manager
        .getMongoRepository(DocumentEntity)
        .manager.connection.mongoManager.getMongoRepository(DocumentEntity);

      const currentFeaturedCount = await collection.count({
        _id: { $ne: new ObjectId(id) },
        isHomePage: true,
      });

      if (currentFeaturedCount >= 4) {
        throw new BadRequestException(
          'A maximum of 4 documents can be featured on the homepage at the same time. Please unfeature another document first.',
        );
      }
    }

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
          file.mimetype,
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
        originalFileName: file.originalname,
        contentType: file.mimetype,
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

        // Atomically increment approvedUploadCount so concurrent approvals
        // cannot both read the same stale count and both grant a credit.
        // $inc is a single atomic MongoDB operation — no read-then-write window.
        const userCollection = this.userService.getUserMongoRepository();
        const updateResult = await userCollection.findOneAndUpdate(
          { _id: new ObjectId(doc.userId) } as any,
          { $inc: { approvedUploadCount: 1 } } as any,
          { returnDocument: 'after' } as any,
        );

        const updatedUser = updateResult?.value ?? updateResult;
        if (updatedUser && (updatedUser.approvedUploadCount || 0) % 3 === 0) {
          // Another atomic increment — only runs for exactly the call that
          // pushed the count to a multiple of 3; concurrent calls land on
          // different final counts, so at most one will hit the branch.
          await userCollection.updateOne(
            { _id: new ObjectId(doc.userId) } as any,
            { $inc: { unlockCredits: 1 } } as any,
          );
          await this.notificationService.createNotification({
            userId: doc.userId.toString(),
            type: NotificationType.UNLOCK_CREDIT_EARNED,
            title: 'Unlock Credit Earned!',
            message: 'You earned 1 unlock credit for approved uploads.',
          });
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
    return this.findAll(filter, false);
  }

  // ─── ADMIN: toggle homepage status (max 4) ───────────
  async setHomePageStatus(
    id: string,
    isHomePage: boolean,
  ): Promise<DocumentEntity> {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const doc = await this.findById(id);
    if (!doc) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    if (isHomePage) {
      const collection = this.documentRepository.manager
        .getMongoRepository(DocumentEntity)
        .manager.connection.mongoManager.getMongoRepository(DocumentEntity);

      const currentFeaturedCount = await collection.count({
        _id: { $ne: new ObjectId(id) },
        isHomePage: true,
      });

      if (currentFeaturedCount >= 4) {
        throw new BadRequestException(
          'A maximum of 4 documents can be featured on the homepage at the same time. Please unfeature another document first.',
        );
      }
    }

    const result = await this.documentRepository.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isHomePage } },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    return this.findById(id);
  }

  // ─── HOMEPAGE SHOWCASE (up to 4 featured docs) ────────
  async findHomePage() {
    const featured = await this.findPublic({
      isHomePage: true,
      limit: 4,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    // If documents are explicitly marked as isHomePage, return them
    if (featured.data && featured.data.length > 0) {
      return featured;
    }

    // Graceful fallback: If no documents have isHomePage=true set yet,
    // return top approved documents so guest users always see dynamic documents on the homepage
    return this.findPublic({
      limit: 4,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
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
