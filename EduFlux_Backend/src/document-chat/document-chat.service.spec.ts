import { Test, TestingModule } from '@nestjs/testing';
import { DocumentChatService } from './document-chat.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentChunkEntity } from './entity/document-chunk.entity';
import { DocumentEntity } from 'src/documents/entity';
import { TextExtractionService } from './text-extraction.service';
import { EmbeddingService } from './embedding.service';

describe('DocumentChatService', () => {
  let service: DocumentChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentChatService,
        {
          provide: getRepositoryToken(DocumentChunkEntity),
          useValue: { find: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: TextExtractionService,
          useValue: { extractText: jest.fn() },
        },
        {
          provide: EmbeddingService,
          useValue: { getEmbedding: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DocumentChatService>(DocumentChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
