import { ApiProperty } from '@nestjs/swagger';
import { CreateDocumentInput } from './create-document.input';

export class UploadDocumentInput extends CreateDocumentInput {
  @ApiProperty({
    description: 'Document file to upload',
    type: 'string',
    format: 'binary',
  })
  file: any;
}
