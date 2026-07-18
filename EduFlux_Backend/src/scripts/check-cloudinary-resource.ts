import * as fs from 'fs';
import * as path from 'path';
import { MongoClient, ObjectId } from 'mongodb';
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

async function run() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME || 'dev';
  if (!uri) {
    console.error('MONGO_URI is not set');
    process.exit(1);
  }

  const targetFileKey = 'eduflux/docs/6a2fedc97c2222c098955435/1783067610179-Trigger_Questions';

  console.log('--- 1. Querying Database for Document Record ---');
  const client = new MongoClient(uri);
  let dbDoc: any = null;
  try {
    await client.connect();
    const db = client.db(dbName);
    const documentsCollection = db.collection('documents');
    dbDoc = await documentsCollection.findOne({ fileKey: targetFileKey });

    if (dbDoc) {
      console.log('Database Record Found:');
      console.log(JSON.stringify({
        _id: dbDoc._id,
        title: dbDoc.title,
        fileKey: dbDoc.fileKey,
        fileUrl: dbDoc.fileUrl,
        fileFormat: dbDoc.fileFormat,
        resourceType: dbDoc.resourceType,
        fileVersion: dbDoc.fileVersion,
      }, null, 2));
    } else {
      console.log('Database Record NOT Found for fileKey:', targetFileKey);
    }
  } catch (err) {
    console.error('Database query failed:', err);
  } finally {
    await client.close();
  }

  console.log('\n--- 2. Querying Cloudinary via Admin API ---');
  console.log(`Public ID (fileKey): ${targetFileKey}`);
  console.log(`Resource Type: 'raw'`);
  console.log(`Type: 'upload'`);

  try {
    const res = await cloudinary.api.resource(targetFileKey, {
      resource_type: 'raw',
      type: 'upload',
    });

    console.log('\nAsset Found on Cloudinary!');
    console.log(JSON.stringify({
      public_id: res.public_id,
      resource_type: res.resource_type,
      type: res.type,
      version: res.version,
      format: res.format,
      bytes: res.bytes,
      secure_url: res.secure_url,
      url: res.url,
      created_at: res.created_at,
    }, null, 2));

    console.log('\n--- 3. Comparison Summary ---');
    if (dbDoc) {
      const matchKey = dbDoc.fileKey === res.public_id;
      const matchVersion = String(dbDoc.fileVersion) === String(res.version);
      const matchResourceType = dbDoc.resourceType === res.resource_type;
      
      console.log(`fileKey matches Cloudinary public_id: ${matchKey ? 'YES' : 'NO'}`);
      console.log(`fileVersion matches Cloudinary version: ${matchVersion ? 'YES' : 'NO'} (${dbDoc.fileVersion} vs ${res.version})`);
      console.log(`resourceType matches Cloudinary resource_type: ${matchResourceType ? 'YES' : 'NO'} (${dbDoc.resourceType} vs ${res.resource_type})`);
    }

  } catch (err: any) {
    console.log('\nAsset NOT Found or Query Failed on Cloudinary!');
    if (err.http_code) {
      console.log(`HTTP Status Code: ${err.http_code}`);
    }
    console.error('Error Details:', err.message || err);
  }
}

run();
