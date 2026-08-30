import * as fs from 'fs';
import * as path from 'path';
import { MongoClient, ObjectId } from 'mongodb';

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
      const val = parts
        .slice(1)
        .join('=')
        .trim()
        .replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  }
}

loadEnv();

async function run() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME || 'dev';
  if (!uri) {
    console.error('MONGO_URI not defined in .env');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB database:', dbName);
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    const documentsCollection = db.collection('documents');

    const users = await usersCollection.find({}).toArray();
    console.log(`Found ${users.length} users to process.`);
    console.log('----------------------------------------------------');

    for (const user of users) {
      const userIdStr = user._id.toString();
      const orConditions: any[] = [{ userId: userIdStr }];
      if (ObjectId.isValid(userIdStr)) {
        orConditions.push({ userId: new ObjectId(userIdStr) });
      }

      const documentsCount = await documentsCollection.countDocuments({
        $and: [
          { $or: orConditions },
          { status: { $in: ['pending', 'approved', 'published'] } },
        ],
      });

      const totalEarned = Math.floor(documentsCount / 3);
      const prevCreditsEverEarned = Number(user.creditsEverEarned || 0);
      const prevUnlockCredits = Number(user.unlockCredits || 0);

      const newCreditsEverEarned = Math.max(prevCreditsEverEarned, totalEarned);
      const newlyGranted = newCreditsEverEarned - prevCreditsEverEarned;
      const newUnlockCredits = prevUnlockCredits + newlyGranted;

      if (
        user.creditsEverEarned !== newCreditsEverEarned ||
        user.unlockCredits !== newUnlockCredits ||
        user.approvedUploadCount !== documentsCount
      ) {
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              creditsEverEarned: newCreditsEverEarned,
              unlockCredits: newUnlockCredits,
              approvedUploadCount: documentsCount,
            },
          },
        );

        console.log(`User: ${user.email || user._id}`);
        console.log(`  Valid docs: ${documentsCount}`);
        console.log(`  creditsEverEarned: ${prevCreditsEverEarned} -> ${newCreditsEverEarned}`);
        console.log(`  unlockCredits: ${prevUnlockCredits} -> ${newUnlockCredits}`);
        console.log('----------------------------------------------------');
      } else {
        console.log(
          `User: ${user.email || user._id} — already up to date (${documentsCount} docs, ${user.unlockCredits ?? 0} credits).`,
        );
      }
    }

    console.log('Backfill completed successfully.');
  } catch (error) {
    console.error('Backfill script failed:', error);
  } finally {
    await client.close();
  }
}

run();
