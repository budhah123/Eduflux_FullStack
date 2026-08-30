// src/access/access.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/entity';
import { SubscriptionEntity } from 'src/subscription/entity';
import { UnlockedDocumentEntity } from './entity/unlocked-document.entity';
import { AccessService } from './access.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      SubscriptionEntity,
      UnlockedDocumentEntity,
    ]),
  ],
  providers: [AccessService],
  exports: [AccessService], // so DocumentModule can use it
})
export class AccessModule {}