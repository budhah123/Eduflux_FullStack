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

  private isHeadingLine(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 90) return false;
    if (/[.!?,;]$/.test(trimmed)) return false;

    const isAllCaps =
      /^[A-Z0-9][A-Z0-9\s\-:&/]+$/.test(trimmed) && /[A-Z]{2,}/.test(trimmed);
    const isNumberedHeading = /^(chapter\s+)?\d+(\.\d+)*[.)]?\s+[A-Za-z]/i.test(
      trimmed,
    );
    const isShortTitleCase =
      trimmed.split(/\s+/).length <= 8 &&
      /^[A-Z][a-zA-Z0-9\s\-:&/]+$/.test(trimmed) &&
      trimmed === trimmed.replace(/\b\w/g, (c) => c.toUpperCase());

    return isAllCaps || isNumberedHeading || isShortTitleCase;
  }

  private splitIntoSections(
    text: string,
  ): { heading: string | null; content: string }[] {
    const lines = text.split(/\r?\n/);
    const sections: { heading: string | null; content: string }[] = [];
    let currentHeading: string | null = null;
    let currentLines: string[] = [];

    const flush = () => {
      const content = currentLines.join(' ').replace(/\s+/g, ' ').trim();
      if (content.length > 0) {
        sections.push({ heading: currentHeading, content });
      }
      currentLines = [];
    };

    for (const line of lines) {
      if (this.isHeadingLine(line)) {
        flush();
        currentHeading = line.trim();
      } else {
        currentLines.push(line);
      }
    }
    flush();

    if (sections.every((s) => s.heading === null)) {
      const fullText = text.replace(/\s+/g, ' ').trim();
      return [{ heading: null, content: fullText }];
    }

    return sections;
  }

  chunkText(
    text: string,
    chunkWords = 500,
    overlapWords = 50,
  ): { content: string; sectionHeading: string | null }[] {
    const sections = this.splitIntoSections(text);
    const chunks: { content: string; sectionHeading: string | null }[] = [];

    for (const section of sections) {
      const words = section.content.split(/\s+/).filter(Boolean);
      const prefix = section.heading ? `Section: ${section.heading}\n` : '';

      if (words.length <= chunkWords) {
        const body = words.join(' ');
        if (body.trim().length > 0) {
          chunks.push({
            content: prefix + body,
            sectionHeading: section.heading,
          });
        }
        continue;
      }

      for (let i = 0; i < words.length; i += chunkWords - overlapWords) {
        const body = words.slice(i, i + chunkWords).join(' ');
        if (body.trim().length > 0) {
          chunks.push({
            content: prefix + body,
            sectionHeading: section.heading,
          });
        }
      }
    }

    return chunks;
  }
}
