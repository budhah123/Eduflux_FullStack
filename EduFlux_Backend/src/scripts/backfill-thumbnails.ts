import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { MongoClient } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('.env file not found at:', envPath);
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts
        .slice(1)
        .join('=')
        .trim()
        .replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  }
}

loadEnv();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getThumbnailUrl(
  fileKey: string,
  resourceType: string,
  version?: string,
): string | null {
  if (!fileKey) return null;

  const safeResourceType =
    resourceType === 'raw' ? 'image' : resourceType || 'image';

  return cloudinary.url(fileKey, {
    resource_type: safeResourceType,
    type: 'upload',
    format: 'jpg',
    version: version ? Number(version) : undefined,
    transformation: [
      {
        page: 1,
        width: 400,
        crop: 'fill',
        quality: 'auto',
        density: 150,
      },
    ],
    secure: true,
  });
}

async function uploadGeneratedImage(
  imageBuffer: Buffer,
  publicId: string,
): Promise<string | null> {
  try {
    const result = await new Promise<{ secure_url?: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: publicId,
          overwrite: true,
          transformation: [{ width: 400, height: 400, crop: 'fill' }],
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new Error(
                `Thumbnail upload failed: ${error?.message || 'No upload response from Cloudinary'}`,
              ),
            );
            return;
          }

          resolve({ secure_url: result.secure_url });
        },
      );

      streamifier.createReadStream(imageBuffer).pipe(uploadStream);
    });

    return result.secure_url ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to upload generated thumbnail ${publicId}:`, message);
    return null;
  }
}

async function generateRawPdfThumbnail(
  fileKey: string,
  fileUrl: string,
): Promise<string | null> {
  if (!fileKey || !fileUrl) return null;

  try {
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    const pdfBuffer = Buffer.isBuffer(response.data)
      ? response.data
      : Buffer.from(response.data);

    const pdfModule = await import('pdf-to-img');
    const pdfRenderer =
      (pdfModule as any).pdf ??
      (pdfModule as any).default ??
      (pdfModule as any);

    const doc = await pdfRenderer(pdfBuffer, {
      format: 'jpg',
      scale: 1.5,
    });

    const pageBuffer = await doc.getPage(1);
    if (typeof doc.destroy === 'function') {
      await doc.destroy();
    }

    const cleanPublicId = fileKey.replace(/\.[^.]+$/, '');
    const thumbPublicId = `${cleanPublicId}-thumb`;
    return await uploadGeneratedImage(pageBuffer, thumbPublicId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to generate thumbnail for raw PDF ${fileKey}:`, message);
    return null;
  }
}

function extractFormat(doc: any): string {
  if (doc.fileFormat && typeof doc.fileFormat === 'string') {
    return doc.fileFormat.toLowerCase();
  }
  if (doc.fileUrl && typeof doc.fileUrl === 'string') {
    const cleanUrl = doc.fileUrl.split('?')[0];
    const ext = cleanUrl.split('.').pop();
    if (ext && ext !== cleanUrl) {
      return ext.toLowerCase();
    }
  }
  if (doc.fileKey && typeof doc.fileKey === 'string') {
    const ext = doc.fileKey.split('.').pop();
    if (ext && ext !== doc.fileKey) {
      return ext.toLowerCase();
    }
  }
  return '';
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function buildDocxSvg(text: string, title?: string): string {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const docTitle = escapeXml(
    (title || lines[0] || 'Document Preview').slice(0, 60),
  );
  const subHeading =
    lines.length > 1 ? escapeXml(lines[1].slice(0, 70)) : '';

  const bodyParagraphs: string[] = [];
  const startIdx = lines.length > 2 ? 2 : lines.length > 1 ? 1 : 0;
  for (let i = startIdx; i < Math.min(lines.length, startIdx + 10); i++) {
    let remaining = lines[i];
    while (remaining.length > 0 && bodyParagraphs.length < 16) {
      const chunk = remaining.slice(0, 65);
      bodyParagraphs.push(escapeXml(chunk));
      remaining = remaining.slice(65);
    }
  }

  const renderedLines = bodyParagraphs
    .map((line, idx) => {
      const y = 210 + idx * 22;
      return `<text x="60" y="${y}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" fill="#334155">${line}</text>`;
    })
    .join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <rect width="600" height="800" fill="#f8fafc"/>
    <rect x="30" y="25" width="540" height="750" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" rx="8"/>
    <rect x="30" y="25" width="540" height="10" fill="#2563eb" rx="4"/>
    
    <rect x="60" y="60" width="65" height="24" rx="5" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
    <text x="72" y="76" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#2563eb">DOCX</text>
    
    <text x="60" y="120" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#0f172a">${docTitle}</text>
    ${subHeading ? `<text x="60" y="148" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#475569">${subHeading}</text>` : ''}
    <line x1="60" y1="170" x2="540" y2="170" stroke="#e2e8f0" stroke-width="1.5"/>
    
    ${renderedLines}
    
    <rect x="60" y="620" width="480" height="8" rx="3" fill="#f1f5f9"/>
    <rect x="60" y="640" width="430" height="8" rx="3" fill="#f1f5f9"/>
    <rect x="60" y="660" width="460" height="8" rx="3" fill="#f1f5f9"/>
    
    <line x1="60" y1="720" x2="540" y2="720" stroke="#f1f5f9" stroke-width="1"/>
    <text x="60" y="742" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#94a3b8">Page 1 • Document Preview</text>
  </svg>`;
}

async function generateDocxThumbnail(
  fileKey: string,
  fileUrl: string,
): Promise<string | null> {
  if (!fileKey || !fileUrl) return null;

  try {
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    const docxBuffer = Buffer.isBuffer(response.data)
      ? response.data
      : Buffer.from(response.data);

    const mammoth = await import('mammoth');
    const textResult = await mammoth.extractRawText({ buffer: docxBuffer });
    const rawText = textResult.value || '';

    const svg = buildDocxSvg(rawText);
    const cleanPublicId = fileKey.replace(/\.[^.]+$/, '');
    const thumbPublicId = `${cleanPublicId}-thumb`;

    const uploadResult = await cloudinary.uploader.upload(
      `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      {
        resource_type: 'image',
        public_id: thumbPublicId,
        format: 'jpg',
        overwrite: true,
        transformation: [{ width: 400, crop: 'fill', quality: 'auto' }],
      },
    );

    return uploadResult.secure_url || null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to generate thumbnail for DOCX ${fileKey}:`, message);
    return null;
  }
}

async function generateThumbnailForDocument(doc: any): Promise<string | null> {
  const fileKey = doc.fileKey;
  const fileUrl = doc.fileUrl;
  const fileFormat = extractFormat(doc);

  if (
    !fileKey ||
    !fileUrl ||
    !['pdf', 'docx', 'doc', 'image', 'png', 'jpg', 'jpeg', 'webp'].includes(fileFormat)
  ) {
    return null;
  }

  const resourceType =
    doc.resourceType || (['pdf', 'docx', 'doc'].includes(fileFormat) ? 'raw' : 'image');

  if (resourceType === 'image' && fileFormat === 'pdf') {
    return getThumbnailUrl(fileKey, resourceType, doc.fileVersion) ?? null;
  }

  if (fileFormat === 'pdf') {
    return (await generateRawPdfThumbnail(fileKey, fileUrl)) ?? null;
  }

  if (['docx', 'doc'].includes(fileFormat)) {
    return (await generateDocxThumbnail(fileKey, fileUrl)) ?? null;
  }

  return null;
}

async function run() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME || 'dev';

  if (!uri) {
    console.error('MONGO_URI environment variable is not defined.');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB successfully.');
    const db = client.db(dbName);
    const documentsCollection = db.collection('documents');

    const force = process.argv.includes('--force');
    const query = force
      ? {}
      : {
          $or: [
            { thumbnailUrl: { $exists: false } },
            { thumbnailUrl: null },
            { thumbnailUrl: '' },
            { thumbnailUrl: { $not: /\.jpg(\?.*)?$/i } },
          ],
        };

    const docs = await documentsCollection.find(query).toArray();

    console.log(`Found ${docs.length} documents missing thumbnailUrl.`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const doc of docs) {
      const title = doc.title || doc.fileKey || doc._id;
      const existing = doc.thumbnailUrl ?? 'missing';

      try {
        console.log(`\n[*] Processing: "${title}" (_id: ${doc._id})`);
        console.log(
          `    resourceType: ${doc.resourceType || 'unknown'}, format: ${extractFormat(doc) || 'unknown'}`,
        );
        console.log(`    existing thumbnailUrl: ${existing}`);

        const generated = await generateThumbnailForDocument(doc);

        if (!generated) {
          console.log(
            `[-] Skipped "${title}" - unsupported format or no thumbnail generated.`,
          );
          skipped++;
          continue;
        }

        await documentsCollection.updateOne(
          { _id: doc._id },
          { $set: { thumbnailUrl: generated } },
        );

        console.log(`[+] Updated "${title}" -> ${generated}`);
        updated++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[!] Failed "${title}": ${message}`);
        failed++;
      }
    }

    console.log(`\n========================================`);
    console.log(
      `Backfill completed: updated=${updated}, skipped=${skipped}, failed=${failed}`,
    );
    console.log(`========================================\n`);
  } catch (error) {
    console.error('Backfill failed:', error);
  } finally {
    await client.close();
  }
}

run();
