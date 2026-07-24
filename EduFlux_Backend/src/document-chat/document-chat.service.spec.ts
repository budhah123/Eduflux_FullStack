import { Test, TestingModule } from '@nestjs/testing';
import { DocumentChatService } from './document-chat.service';

describe('DocumentChatService', () => {
  let service: DocumentChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentChatService],
    }).compile();

    service = module.get<DocumentChatService>(DocumentChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
