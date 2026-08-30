import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingEntity } from './entity';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { UserModule } from 'src/user/user.module';
import { DocumentEntity } from 'src/documents/entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RatingEntity, DocumentEntity]),
    UserModule,
  ],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}
