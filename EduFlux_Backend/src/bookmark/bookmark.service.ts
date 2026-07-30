import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BookmarkEntity } from './entity';
import { MongoRepository } from 'typeorm';
import { DocumentEntity } from 'src/documents';
import { ObjectId } from 'mongodb';

@Injectable()
export class BookmarkService {
  constructor(
    @InjectRepository(BookmarkEntity)
    private readonly bookmarkRepository: MongoRepository<BookmarkEntity>,

    @InjectRepository(DocumentEntity)
    private readonly documentRepository: MongoRepository<DocumentEntity>,
  ) {}

  async addBookmark(userId: string, documentId: string) {
    const document = await this.documentRepository.findOne({
      where: { _id: new ObjectId(documentId) },
    });
    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }
    const existing = await this.bookmarkRepository.findOne({
      where: { userId, documentId },
    });
    if (existing) {
      throw new NotFoundException('Document is already bookmarked by the user');
    }
    const bookmark = this.bookmarkRepository.create({ userId, documentId });
    return await this.bookmarkRepository.save(bookmark);
  }

  async removeBookmark(userId: string, documentId: string) {
    const existing = await this.bookmarkRepository.findOne({
      where: { userId, documentId },
    });
    if (!existing) {
      throw new NotFoundException(
        'Bookmark not found for the user and document',
      );
    }
    await this.bookmarkRepository.delete(existing._id);
    return { message: 'Bookmark removed successfully' };
  }

  async getUserBookmarks(userId: string) {
    const bookmarks = await this.bookmarkRepository.find({ userId } as any);
    if (bookmarks.length === 0) return [];

    const documentIds = bookmarks.map((b) => new ObjectId(b.documentId));
    const documents = await this.documentRepository.find({
      where: { _id: { $in: documentIds } },
    } as any);

    return bookmarks.map((bookmark) => ({
      ...bookmark,
      document: documents.find(
        (doc: any) => doc._id.toString() === bookmark.documentId,
      ),
    }));
  }

  async isBookmarked(userId: string, documentId: string) {
    const count = await this.bookmarkRepository.count({
      userId,
      documentId,
    } as any);
    return count > 0;
  }
}
