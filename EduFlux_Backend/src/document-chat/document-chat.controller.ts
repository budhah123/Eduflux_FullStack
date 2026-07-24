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
    console.log('[DocumentChatController] fetch document start', { id });
    const doc = await this.documentsService.getDocument({
      _id: new ObjectId(id),
    });
    console.log('[DocumentChatController] fetch document complete', {
      id,
      found: Boolean(doc),
    });
    if (!doc) throw new NotFoundException('Document not found');

    if (doc.isPremiumOnly) {
      console.log('[DocumentChatController] checking access', { id });
      const result = await this.accessService.checkAccess(req.user);
      console.log('[DocumentChatController] access check complete', {
        id,
        access: result.access,
      });
      if (!result.access) {
        throw new ForbiddenException('Unlock this document to use AI chat');
      }
    }

    console.log('[DocumentChatController] ask question start', { id });
    const answer = await this.chatService.askQuestion(id, dto.question);
    console.log('[DocumentChatController] ask question complete', { id });
    return { answer };
  }
}
