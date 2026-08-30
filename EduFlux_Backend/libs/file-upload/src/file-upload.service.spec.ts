import { Test, TestingModule } from '@nestjs/testing';
import { FileUploadService } from './file-upload.service';
import uploadConfig from './config/upload.config';

describe('FileUploadService', () => {
  let service: FileUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        {
          provide: uploadConfig.KEY,
          useValue: {
            cloudinary: {
              cloudName: 'test-cloud',
              apiKey: 'test-key',
              apiSecret: 'test-secret',
              folder: 'test/docs',
            },
          },
        },
      ],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
