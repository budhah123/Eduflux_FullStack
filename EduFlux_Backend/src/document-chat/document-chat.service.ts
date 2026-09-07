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
  private static readonly CHUNK_VERSION = 3;
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
    const isCurrentVersion =
      existing.length > 0 &&
      existing.every(
        (c) => c.chunkVersion === DocumentChatService.CHUNK_VERSION,
      );
    if (isCurrentVersion) {
      return;
    }
    if (existing.length > 0) {
      await this.chunkRepo.remove(existing);
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

    const chunks = this.textExtraction.chunkText(text); // [{ content, sectionHeading }]

    const contentEmbeddings = await this.embeddingService.embed(
      chunks.map((c) => c.content),
    );

    const uniqueHeadings = Array.from(
      new Set(
        chunks.map((c) => c.sectionHeading).filter((h): h is string => !!h),
      ),
    );
    const headingEmbeddingsList =
      uniqueHeadings.length > 0
        ? await this.embeddingService.embed(uniqueHeadings)
        : [];
    const headingEmbeddingMap = new Map(
      uniqueHeadings.map((h, i) => [h, headingEmbeddingsList[i]]),
    );

    const chunkEntities = chunks.map((chunk, index) =>
      this.chunkRepo.create({
        documentId,
        content: chunk.content,
        sectionHeading: chunk.sectionHeading ?? undefined,
        headingEmbedding: chunk.sectionHeading
          ? headingEmbeddingMap.get(chunk.sectionHeading)
          : undefined,
        chunkIndex: index,
        embedding: contentEmbeddings[index],
        chunkVersion: DocumentChatService.CHUNK_VERSION,
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

    const headingScore = (chunk: DocumentChunkEntity): number => {
      if (!chunk.headingEmbedding) return 0;
      return this.embeddingService.cosineSimilarity(
        questionEmbedding,
        chunk.headingEmbedding,
      );
    };

    const scored = allChunks.map((chunk) => {
      const contentScore = this.embeddingService.cosineSimilarity(
        questionEmbedding,
        chunk.embedding,
      );
      const hScore = headingScore(chunk);
      return { chunk, score: Math.max(contentScore, hScore) };
    });

    const ranked = scored.sort((a, b) => b.score - a.score);
    const topMatches = ranked.slice(0, 6);

    const chunksByIndex = new Map(allChunks.map((c) => [c.chunkIndex, c]));
    const contextChunks = new Map<string, string>();
    for (const match of topMatches) {
      contextChunks.set(match.chunk._id.toString(), match.chunk.content);
    }
    for (const match of topMatches.slice(0, 2)) {
      const prev = chunksByIndex.get(match.chunk.chunkIndex - 1);
      const next = chunksByIndex.get(match.chunk.chunkIndex + 1);
      if (prev) contextChunks.set(prev._id.toString(), prev.content);
      if (next) contextChunks.set(next._id.toString(), next.content);
    }

    const context = Array.from(contextChunks.values()).join('\n\n---\n\n');

    const groq = this.getGroqClient();
    if (!groq) {
      return 'AI chat is not configured because GROQ_API_KEY is missing.';
    }

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'user',
          content: `You are an academic assistant. Answer the question based ONLY on the following excerpts from the document.

The document may label its sections differently from how the question phrases them, and capitalization should never matter (e.g. "ABSTRACT" and "abstract" are the same thing). Reason about the underlying meaning of the question and match it to whichever section or passage is semantically about that topic, even if the exact words differ. Do not claim information is missing just because the precise wording or heading differs from the question.

If, after genuinely considering semantic equivalents, the answer truly isn't covered in these excerpts, say so honestly rather than guessing.

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
