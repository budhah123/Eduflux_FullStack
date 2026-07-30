import { PartialType } from '@nestjs/swagger';
import { CreateBookmarkInput } from './create-bookmark.input';

export class UpdateBookmarkInput extends PartialType(CreateBookmarkInput) {}
