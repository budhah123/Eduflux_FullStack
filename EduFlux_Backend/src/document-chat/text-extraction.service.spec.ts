import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TextExtractionService } from './text-extraction.service';

describe('TextExtractionService', () => {
  let service: TextExtractionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TextExtractionService],
    }).compile();

    service = module.get<TextExtractionService>(TextExtractionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject an undefined format with a clear error', async () => {
    await expect(
      service.extractText(Buffer.from('test'), undefined),
    ).rejects.toThrow(BadRequestException);
  });
});
