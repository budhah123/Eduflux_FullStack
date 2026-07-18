import * as fs from 'fs';
import * as path from 'path';
import { MongoClient } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

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
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  }
}

// Load Environment Variables
loadEnv();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function fetchCloudinaryInfo(fileKey: string) {
  // Cloudinary public_ids might contain file extensions if uploaded in a certain way, 
  // but usually fileKey holds the full public_id.
  // We try 'image' resource_type first as PDFs and images upload as 'image' resource_type under 'auto'.
  try {
    const res = await cloudinary.api.resource(fileKey, { resource_type: 'image' });
    return { resourceType: 'image', version: String(res.version) };
  } catch (err: any) {
    try {
      const res = await cloudinary.api.resource(fileKey, { resource_type: 'raw' });
      return { resourceType: 'raw', version: String(res.version) };
    } catch (err2: any) {
      try {
        const res = await cloudinary.api.resource(fileKey, { resource_type: 'video' });
        return { resourceType: 'video', version: String(res.version) };
      } catch (err3: any) {
        return null;
      }
    }
  }
}

async function run() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME || 'dev';
  if (!uri) {
    console.error('MONGO_URI environment variable is not defined.');
    process.exit(1);
  }

  console.log(`Connecting to database...`);
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB database successfully.');

    const db = client.db(dbName);
    const documentsCollection = db.collection('documents');

    const docs = await documentsCollection.find({}).toArray();
    console.log(`Found ${docs.length} documents in the database.`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const doc of docs) {
      if (!doc.fileKey) {
        console.log(`[-] Skipping document "${doc.title}" (_id: ${doc._id}) - no fileKey`);
        skippedCount++;
        continue;
      }

      console.log(`[*] Querying Cloudinary for "${doc.title}" (fileKey: ${doc.fileKey})...`);
      const info = await fetchCloudinaryInfo(doc.fileKey);

      if (!info) {
        console.error(`[!] Failed to find asset on Cloudinary for "${doc.title}" (fileKey: ${doc.fileKey})`);
        errorCount++;
        continue;
      }

      const currentResourceType = doc.resourceType;
      const currentFileVersion = doc.fileVersion;

      const needsUpdate = currentResourceType !== info.resourceType || currentFileVersion !== info.version;

      if (needsUpdate) {
        console.log(
          `[+] Updating "${doc.title}" (_id: ${doc._id}):\n` +
          `    resourceType: '${currentResourceType || 'undefined'}' -> '${info.resourceType}'\n` +
          `    fileVersion: '${currentFileVersion || 'undefined'}' -> '${info.version}'`
        );

        await documentsCollection.updateOne(
          { _id: doc._id },
          {
            $set: {
              resourceType: info.resourceType,
              fileVersion: info.version,
            },
          }
        );
        updatedCount++;
      } else {
        console.log(`[=] Document "${doc.title}" is already up to date.`);
        skippedCount++;
      }
    }

    console.log(`\nMigration completed:`);
    console.log(`- Updated: ${updatedCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
  } catch (error) {
    console.error('Migration failed with error:', error);
  } finally {
    await client.close();
    console.log('Database connection closed.');
  }
}

run();
