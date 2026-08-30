import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { RatingEntity } from './entity';
import { CreateRatingInput } from './dto';
import { DocumentEntity } from 'src/documents/entity';
import { UserService } from 'src/user/user.service';
import { UserType } from 'src/user/enum';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(RatingEntity)
    private readonly ratingRepository: MongoRepository<RatingEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: MongoRepository<DocumentEntity>,
    private readonly userService: UserService,
  ) {}

  async createOrUpdateRating(userId: string, dto: CreateRatingInput) {
    if (!ObjectId.isValid(dto.documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    const document = await this.documentRepository.findOne({
      where: { _id: new ObjectId(dto.documentId) },
    });

    if (!document) {
      throw new NotFoundException(
        `Document with ID ${dto.documentId} not found`,
      );
    }

    const existing = await this.ratingRepository.findOne({
      where: { userId, documentId: dto.documentId },
    } as any);

    if (existing) {
      Object.assign(existing, {
        stars: dto.stars,
        comment: dto.comment,
      });
      return this.ratingRepository.save(existing);
    }

    const rating = this.ratingRepository.create({
      userId,
      documentId: dto.documentId,
      stars: dto.stars,
      comment: dto.comment,
    });

    return this.ratingRepository.save(rating);
  }

  async getRatingsForDocument(
    documentId: string,
    pagination?: { page?: number; limit?: number },
  ) {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;

    const [ratings, total] = await this.ratingRepository.findAndCount({
      where: { documentId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    } as any);

    const userIds = [
      ...new Set(ratings.map((rating) => rating.userId).filter(Boolean)),
    ];
    const users = await Promise.all(
      userIds.map(async (id) => {
        const user = await this.userService.getUser({ _id: new ObjectId(id) });
        return { id, user };
      }),
    );

    const userMap = new Map(users.map(({ id, user }) => [id, user]));

    const data = ratings.map((rating) => {
      const user = userMap.get(rating.userId);
      return {
        ...rating,
        user: user
          ? {
              _id: user._id,
              displayName:
                `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                user.email,
              avatar:
                user.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || user.email || 'User')}&background=3525cd&color=fff`,
            }
          : null,
      };
    });

    const average = await this.getAverageRating(documentId);

    return {
      data,
      total,
      average: average.average,
      count: average.count,
    };
  }

  async getAverageRating(
    documentId: string,
  ): Promise<{ average: number; count: number }> {
    if (!ObjectId.isValid(documentId)) {
      return { average: 0, count: 0 };
    }

    const ratings = await this.ratingRepository.find({
      where: { documentId },
    } as any);

    if (!ratings.length) {
      return { average: 0, count: 0 };
    }

    const total = ratings.reduce(
      (sum, rating) => sum + Number(rating.stars || 0),
      0,
    );

    return {
      average: Number((total / ratings.length).toFixed(2)),
      count: ratings.length,
    };
  }

  async getAverageRatingForDocuments(documentIds: string[]) {
    if (!documentIds.length) return [];

    const ids = documentIds.map((id) => String(id));
    const stats = await this.ratingRepository.aggregate([
      { $match: { documentId: { $in: ids } } },
      {
        $group: {
          _id: '$documentId',
          average: { $avg: '$stars' },
          count: { $sum: 1 },
        },
      },
    ] as any);

    return (stats || []).map((item) => ({
      documentId: item._id,
      average: Number((item.average || 0).toFixed(2)),
      count: item.count || 0,
    }));
  }

  async deleteRating(userId: string, ratingId: string) {
    if (!ObjectId.isValid(ratingId)) {
      throw new BadRequestException('Invalid rating ID');
    }

    const rating = await this.ratingRepository.findOne({
      where: { _id: new ObjectId(ratingId) },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    const isOwner = String(rating.userId) === String(userId);
    if (!isOwner) {
      const requester = await this.userService.getUser({
        _id: new ObjectId(userId),
      });

      if (!requester || requester.userType !== UserType.ADMIN) {
        throw new UnauthorizedException('You can only delete your own rating');
      }
    }

    await this.ratingRepository.delete(rating._id);
    return { message: 'Rating deleted successfully' };
  }
}
