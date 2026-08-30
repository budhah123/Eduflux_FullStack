/**
 * Backfill institutional status for ALL existing users whose isInstitutional
 * field is false, null, or missing — regardless of which signup method they used
 * (email/password or Google OAuth).
 *
 * Key fix over the naive approach: MongoDB treats null and false as DIFFERENT
 * values in an equality filter. A query of { isInstitutional: false } silently
 * skips documents where the field is null or absent. This script uses $in to
 * catch every non-true state.
 *
 * Run:
 *   npx ts-node -r tsconfig-paths/register src/scripts/backfill-institutional-status.ts
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { computeIsInstitutional } from '../auth/utils/institutional-check.util';

async function backfill() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set in environment');

  const dbName = process.env.DB_NAME ?? 'dev';
  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);
  const users = db.collection('users');

  console.log(`Connected to MongoDB — database: "${dbName}"`);

  // ── Fetch candidates ────────────────────────────────────────────────────────
  // Catch all three non-true states: false, null, and field-absent.
  // { isInstitutional: false } alone misses null/absent — DO NOT use it alone.
  const candidates = await users
    .find({
      $or: [
        { isInstitutional: false },
        { isInstitutional: null },
        { isInstitutional: { $exists: false } },
      ],
    })
    .project({ _id: 1, email: 1, isInstitutional: 1 })
    .toArray();

  console.log(`Found ${candidates.length} candidate user(s) to evaluate.`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of candidates) {
    try {
      const shouldBeInstitutional = computeIsInstitutional(user.email ?? '');

      if (!shouldBeInstitutional) {
        // Email domain is NOT institutional — set false explicitly to normalise
        // null/absent values (makes future queries with { isInstitutional: false }
        // safe to use).
        await users.updateOne(
          { _id: user._id },
          { $set: { isInstitutional: false } },
        );
        skipped++;
        continue;
      }

      await users.updateOne(
        { _id: user._id },
        { $set: { isInstitutional: true } },
      );
      console.log(
        `  ✔ Updated ${user.email}  (was: ${JSON.stringify(user.isInstitutional)}) → true`,
      );
      updated++;
    } catch (err) {
      console.error(`  ✘ Error processing ${user.email}:`, err);
      errors++;
    }
  }

  console.log('\n── Summary ─────────────────────────────────────────────────');
  console.log(`  Set to true  : ${updated}`);
  console.log(`  Set to false : ${skipped}  (normalised null/absent → false)`);
  console.log(`  Errors       : ${errors}`);
  console.log('─────────────────────────────────────────────────────────────');

  await client.close();
}

backfill().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
