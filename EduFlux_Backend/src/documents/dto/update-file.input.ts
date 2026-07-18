import { PartialType } from '@nestjs/swagger';
import { CreateDocumentInput } from './create-document.input';

export class UpdateDocumentInput extends PartialType(CreateDocumentInput) {}
