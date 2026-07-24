import { Test, TestingModule } from '@nestjs/testing';
import { DocumentChatController } from './document-chat.controller';

describe('DocumentChatController', () => {
  let controller: DocumentChatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentChatController],
    }).compile();

    controller = module.get<DocumentChatController>(DocumentChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
