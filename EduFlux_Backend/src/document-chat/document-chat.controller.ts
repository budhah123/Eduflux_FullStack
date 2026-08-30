// src/document-chat/document-chat.controller.ts
import {
  Controller,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AtGuard } from '../auth/decorator';
import { AccessService } from '@app/access';
import { DocumentsService } from 'src/documents/documents.service';
import { DocumentChatService } from './document-chat.service';
import { AskQuestionInput } from './dto';
import { ObjectId } from 'mongodb';

@ApiTags('Document Chat')
@ApiBearerAuth('JWT-auth')
@Controller('documents/:id/chat')
export class DocumentChatController {
  private readonly logger = new Logger(DocumentChatController.name);

  constructor(
    private chatService: DocumentChatService,
    private documentsService: DocumentsService,
    private accessService: AccessService,
  ) {}

  @Post()
  @AtGuard()
  @ApiOperation({ summary: 'Ask AI a question about this document' })
  async ask(
    @Param('id') id: string,
    @Body() dto: AskQuestionInput,
    @Req() req,
  ) {
    this.logger.debug(`Fetching document ${id} for chat request`);
    const doc = await this.documentsService.getDocument({
      _id: new ObjectId(id),
    });
    this.logger.debug(`Document ${id} lookup result: ${Boolean(doc)}`);
    if (!doc) throw new NotFoundException('Document not found');

    if (doc.isPremiumOnly) {
      this.logger.debug(`Checking access for document ${id}`);
      const result = await this.accessService.checkViewAccess(req.user);
      this.logger.debug(`Access check for ${id}: ${result.access}`);
      if (!result.access) {
        throw new ForbiddenException('Unlock this document to use AI chat');
      }
    }

    this.logger.debug(`Asking question for document ${id}`);
    const answer = await this.chatService.askQuestion(id, dto.question);
    this.logger.debug(`Completed chat request for document ${id}`);
    return { answer };
  }
}
