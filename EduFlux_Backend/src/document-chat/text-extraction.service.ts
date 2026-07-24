import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

@Injectable()
export class TextExtractionService {
  async extractText(buffer: Buffer, fileFormat?: string): Promise<string> {
    const format = fileFormat?.toLowerCase();

    if (format === 'pdf') {
      const parser = new PDFParse({ data: buffer });
      try {
        const data = await parser.getText();
        return data.text;
      } finally {
        await parser.destroy();
      }
    }
    if (format === 'docx' || format === 'doc') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    throw new BadRequestException(
      `Unsupported file format for AI chat: ${fileFormat}`,
    );
  }

  chunkText(text: string, chunkWords = 500, overlapWords = 50): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkWords - overlapWords) {
      const chunk = words.slice(i, i + chunkWords).join(' ');
      if (chunk.trim().length > 0) chunks.push(chunk);
    }

    return chunks;
  }
}
