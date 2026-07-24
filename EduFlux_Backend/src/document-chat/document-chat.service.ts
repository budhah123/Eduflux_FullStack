// src/document-chat/document-chat.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import Groq from 'groq-sdk';
import axios from 'axios';
import { DocumentChunkEntity } from './entity/document-chunk.entity';
import { DocumentEntity } from 'src/documents/entity';
import { TextExtractionService } from './text-extraction.service';
import { EmbeddingService } from './embedding.service';

@Injectable()
export class DocumentChatService {
  constructor(
    @InjectRepository(DocumentChunkEntity)
    private chunkRepo: MongoRepository<DocumentChunkEntity>,
    @InjectRepository(DocumentEntity)
    private docRepo: MongoRepository<DocumentEntity>,
    private textExtraction: TextExtractionService,
    private embeddingService: EmbeddingService,
  ) {}

  private getGroqClient() {
    const groqApiKey = process.env.GROQ_API_KEY?.trim();
    return groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;
  }

  async processDocument(documentId: string) {
    const existing = await this.chunkRepo.find({ where: { documentId } });
    if (existing.length > 0) {
      return;
    }

    const doc = await this.docRepo.findOne({
      where: { _id: new ObjectId(documentId) },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const response = await axios.get(doc.fileUrl, {
      responseType: 'arraybuffer',
    });
    const buffer = Buffer.from(response.data);

    const text = await this.textExtraction.extractText(buffer, doc.fileFormat);

    const chunks = this.textExtraction.chunkText(text);

    const embeddings = await this.embeddingService.embed(chunks);

    const chunkEntities = chunks.map((content, index) =>
      this.chunkRepo.create({
        documentId,
        content,
        chunkIndex: index,
        embedding: embeddings[index],
      }),
    );

    await this.chunkRepo.save(chunkEntities);
  }

  async askQuestion(documentId: string, question: string): Promise<string> {
    await this.processDocument(documentId);

    const allChunks = await this.chunkRepo.find({ where: { documentId } });
    if (allChunks.length === 0) {
      return "I couldn't extract any text from this document.";
    }

    const [questionEmbedding] = await this.embeddingService.embed([question]);

    const scored = allChunks.map((chunk) => ({
      chunk,
      score: this.embeddingService.cosineSimilarity(
        questionEmbedding,
        chunk.embedding,
      ),
    }));

    const topChunks = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.chunk.content);

    const context = topChunks.join('\n\n---\n\n');

    const groq = this.getGroqClient();
    if (!groq) {
      return 'AI chat is not configured because GROQ_API_KEY is missing.';
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // fast Groq-hosted model
      messages: [
        {
          role: 'user',
          content: `You are an academic assistant. Answer the question based ONLY on the following excerpts from the document. If the answer isn't covered in these excerpts, say so honestly.

Document excerpts:
${context}

Question: ${question}`,
        },
      ],
    });

    return (
      completion.choices[0].message.content ??
      'I could not generate an answer from the document.'
    );
  }
}
