// src/document-chat/document-chat.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentChunkEntity } from './entity/document-chunk.entity';
import { DocumentEntity } from 'src/documents/entity';
import { DocumentChatController } from './document-chat.controller';
import { DocumentChatService } from './document-chat.service';
import { TextExtractionService } from './text-extraction.service';
import { EmbeddingService } from './embedding.service';
import { DocumentsModule } from 'src/documents/documents.module';
import { AccessModule } from '@app/access';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentChunkEntity, DocumentEntity]),
    DocumentsModule,
    AccessModule,
  ],
  controllers: [DocumentChatController],
  providers: [DocumentChatService, TextExtractionService, EmbeddingService],
})
export class DocumentChatModule {}