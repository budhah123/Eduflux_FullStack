// src/document-chat/embedding.service.ts
import { Injectable } from '@nestjs/common';
import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

@Injectable()
export class EmbeddingService {
  async embed(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      console.log('[EmbeddingService] embedding item start', { promptLength: text.length });

      const res = await ollama.embeddings({
        model: 'nomic-embed-text',
        prompt: text,
      });

      console.log('[EmbeddingService] embedding item complete');
      embeddings.push(res.embedding);
    }

    return embeddings;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}