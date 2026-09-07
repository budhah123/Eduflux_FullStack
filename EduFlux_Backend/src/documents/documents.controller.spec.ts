import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { FileUploadService } from '@app/file-upload';
import { AccessService } from '@app/access';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let documentsService: {
    findById: jest.Mock;
    incrementDownload: jest.Mock;
  };
  let uploadService: {
    createSignedUrl: jest.Mock;
  };
  let accessService: {
    checkViewAccess: jest.Mock;
    checkDownloadAccess: jest.Mock;
  };

  beforeEach(async () => {
    documentsService = {
      findById: jest.fn(),
      incrementDownload: jest.fn().mockResolvedValue(undefined),
    };
    uploadService = {
      createSignedUrl: jest.fn().mockResolvedValue('https://signed.url/doc'),
    };
    accessService = {
      checkViewAccess: jest.fn().mockResolvedValue({ access: true, reason: 'institutional' }),
      checkDownloadAccess: jest.fn().mockResolvedValue({ access: true, reason: 'subscription' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsService, useValue: documentsService },
        { provide: FileUploadService, useValue: uploadService },
        { provide: AccessService, useValue: accessService },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  it('should throw InternalServerErrorException if resourceType is missing when requesting preview-url', async () => {
    documentsService.findById.mockResolvedValue({
      _id: 'doc-123',
      title: 'Corrupted Doc',
      fileKey: 'key-123',
      fileFormat: 'pdf',
      resourceType: null, // missing resourceType
      isPremiumOnly: false,
    });

    await expect(
      controller.previewUrl('doc-123', { user: { _id: 'user-1' } } as any),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw InternalServerErrorException if resourceType is missing when requesting download', async () => {
    documentsService.findById.mockResolvedValue({
      _id: 'doc-123',
      title: 'Corrupted Doc',
      fileKey: 'key-123',
      fileFormat: 'pdf',
      resourceType: undefined, // missing resourceType
      isPremiumOnly: false,
    });

    await expect(
      controller.download('doc-123', { user: { _id: 'user-1' } } as any),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should return signed URL when resourceType is present', async () => {
    documentsService.findById.mockResolvedValue({
      _id: 'doc-123',
      title: 'Valid Doc',
      fileKey: 'key-123',
      fileFormat: 'pdf',
      resourceType: 'raw',
      fileVersion: '1',
      isPremiumOnly: false,
    });

    const result = await controller.previewUrl('doc-123', { user: { _id: 'user-1' } } as any);
    expect(result).toEqual({ url: 'https://signed.url/doc' });
    expect(uploadService.createSignedUrl).toHaveBeenCalledWith('key-123', 'pdf', 'raw', '1');
  });

  it('should return the original DOCX filename and MIME type for downloads', async () => {
    documentsService.findById.mockResolvedValue({
      _id: 'doc-456',
      title: 'Study notes',
      originalFileName: 'semester-notes.docx',
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileKey: 'key-456',
      fileFormat: 'docx',
      resourceType: 'raw',
      fileVersion: '2',
      isPremiumOnly: false,
    });

    const result = await controller.download('doc-456', {
      user: { _id: 'user-1' },
    } as any);

    expect(result).toEqual({
      url: 'https://signed.url/doc',
      filename: 'semester-notes.docx',
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    expect(uploadService.createSignedUrl).toHaveBeenCalledWith(
      'key-456',
      'docx',
      'raw',
      '2',
      'semester-notes.docx',
    );
  });
});
