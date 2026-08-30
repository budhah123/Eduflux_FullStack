// Run with: node src/scripts/_run-backfill.cjs
// (plain CommonJS, no transpilation needed)

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'dev';

const INSTITUTIONAL_DOMAINS = (process.env.INSTITUTIONAL_EMAIL_DOMAINS || '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

function computeIsInstitutional(email) {
  const domain = (email || '').split('@')[1];
  if (!domain) return false;
  return INSTITUTIONAL_DOMAINS.includes(domain.toLowerCase());
}

async function run() {
  if (!uri) throw new Error('MONGO_URI not set');
  console.log('INSTITUTIONAL_EMAIL_DOMAINS:', INSTITUTIONAL_DOMAINS);

  const client = await MongoClient.connect(uri);
  const db = client.db(DB_NAME);
  const users = db.collection('users');
  console.log('Connected to DB:', DB_NAME);

  // ── Step 4: Fix nischal's specific account ──────────────────────────────
  const nischalEmail = 'nischal.sharma23@cps.edu.np';
  const nischalBefore = await users.findOne({ email: nischalEmail });
  if (nischalBefore) {
    const r = await users.updateOne(
      { email: nischalEmail },
      { $set: { isInstitutional: true } },
    );
    console.log(
      `\n[STEP 4] nischal fix — matchedCount: ${r.matchedCount}, modifiedCount: ${r.modifiedCount}`,
    );
  } else {
    console.log('\n[STEP 4] nischal account does NOT exist in DB — skipped');
  }

  // ── Step 5: Full backfill ───────────────────────────────────────────────
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

  console.log(`\n[BACKFILL] ${candidates.length} candidate(s) found`);

  let toTrue = 0,
    toFalse = 0,
    errors = 0;

  for (const u of candidates) {
    try {
      const val = computeIsInstitutional(u.email);
      await users.updateOne({ _id: u._id }, { $set: { isInstitutional: val } });
      if (val) {
        console.log(
          `  SET TRUE : ${u.email}  (was: ${JSON.stringify(u.isInstitutional)})`,
        );
        toTrue++;
      } else {
        toFalse++;
      }
    } catch (e) {
      console.error(`  ERROR: ${u.email}`, e.message);
      errors++;
    }
  }

  console.log('\n=== Backfill Summary ===');
  console.log('  -> isInstitutional: true  :', toTrue);
  console.log('  -> isInstitutional: false :', toFalse, '(normalised null/absent)');
  console.log('  errors                    :', errors);

  // ── Step 3: Re-verify ──────────────────────────────────────────────────
  console.log('\n=== STEP 3: Re-verify specific accounts ===');
  const hemraj = await users.findOne({ email: 'hemraj.budhasep23@cps.edu.np' });
  console.log('hemraj  RAW:', JSON.stringify(hemraj, null, 2));
  const nischal = await users.findOne({ email: nischalEmail });
  console.log('nischal RAW:', JSON.stringify(nischal, null, 2));

  // ── Final distribution ──────────────────────────────────────────────────
  console.log('\n=== Final isInstitutional distribution ===');
  const nullC  = await users.countDocuments({ isInstitutional: null });
  const falseC = await users.countDocuments({ isInstitutional: false });
  const trueC  = await users.countDocuments({ isInstitutional: true });
  console.log('  null :', nullC);
  console.log('  false:', falseC);
  console.log('  true :', trueC);

  await client.close();
  console.log('\nDone.');
}

run().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
