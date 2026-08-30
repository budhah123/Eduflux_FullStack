import { Test, TestingModule } from '@nestjs/testing';
import { DocumentChatController } from './document-chat.controller';
import { DocumentChatService } from './document-chat.service';
import { DocumentsService } from 'src/documents/documents.service';
import { AccessService } from '@app/access';

describe('DocumentChatController', () => {
  let controller: DocumentChatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentChatController],
      providers: [
        {
          provide: DocumentChatService,
          useValue: { askQuestion: jest.fn() },
        },
        {
          provide: DocumentsService,
          useValue: { findById: jest.fn() },
        },
        {
          provide: AccessService,
          useValue: { checkViewAccess: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<DocumentChatController>(DocumentChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
