import { Test, TestingModule } from '@nestjs/testing';
import { AdminDocumentController } from './admin-document.controller';

describe('AdminDocumentController', () => {
  let controller: AdminDocumentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDocumentController],
    }).compile();

    controller = module.get<AdminDocumentController>(AdminDocumentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
