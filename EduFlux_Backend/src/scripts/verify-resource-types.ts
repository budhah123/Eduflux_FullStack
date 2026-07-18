import * as fs from 'fs';
import * as path from 'path';
import { MongoClient } from 'mongodb';

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

loadEnv();

async function run() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME || 'dev';
  if (!uri) {
    console.error('MONGO_URI not defined');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const documentsCollection = db.collection('documents');
    const docs = await documentsCollection.find({}).toArray();
    console.log('Current Document Records in Database:');
    console.log('--------------------------------------');
    for (const doc of docs) {
      console.log(`Title: ${doc.title}`);
      console.log(`  _id: ${doc._id}`);
      console.log(`  fileKey: ${doc.fileKey}`);
      console.log(`  resourceType: ${doc.resourceType}`);
      console.log(`  fileVersion: ${doc.fileVersion}`);
      console.log('--------------------------------------');
    }
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await client.close();
  }
}

run();
