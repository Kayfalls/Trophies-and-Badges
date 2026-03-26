#!/usr/bin/env node
// =============================================================
// CREATE ADMIN — Sets up Firebase Auth users with admin claims
// =============================================================
// Usage (single account):
//   FIREBASE_SERVICE_ACCOUNT='<json>' node scripts/create-admin.js <email> <password>
//
// Usage (batch — creates both preconfigured admins at once):
//   FIREBASE_SERVICE_ACCOUNT='<json>' node scripts/create-admin.js --batch
//
// How to get your service account key:
//   Firebase Console → Project Settings → Service Accounts → Generate new private key
// =============================================================

const admin = require('firebase-admin');

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌  FIREBASE_SERVICE_ACCOUNT env variable is not set.');
  console.error('    Export the JSON string of your service account key, then run again.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
});

// ─── PRECONFIGURED ADMIN ACCOUNTS ────────────────────────────
// Change emails / passwords here as needed.
const ADMIN_ACCOUNTS = [
  {
    email:    'kabelomaile73@gmail.com',
    password: 'Admin@TnB2025!',
    label:    'Primary Admin (Kabelo)'
  },
  {
    email:    'admin2@trophiesandbadges.co.za',
    password: 'Admin@TnB2025#2',
    label:    'Secondary Admin'
  }
];

// ─── PROVISION ONE ADMIN ──────────────────────────────────────
async function provisionAdmin({ email, password, label }) {
  console.log(`\n── ${label} <${email}> ──`);

  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
    console.log(`  ℹ  User already exists (uid: ${user.uid})`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      user = await admin.auth().createUser({ email, password, emailVerified: true });
      console.log(`  ✔  User created (uid: ${user.uid})`);
    } else {
      throw err;
    }
  }

  if (!user.emailVerified) {
    await admin.auth().updateUser(user.uid, { emailVerified: true });
    console.log('  ✔  Email marked as verified');
  }

  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log('  ✔  admin:true claim set');
}

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
  const isBatch = process.argv[2] === '--batch';

  if (isBatch) {
    console.log('=== Batch Admin Setup ===');
    for (const account of ADMIN_ACCOUNTS) {
      await provisionAdmin(account);
    }
    console.log('\n✅  Both admin accounts are ready.');
    console.log('    Each user must sign out and back in for the claim to take effect.\n');

  } else {
    const email    = process.argv[2];
    const password = process.argv[3];
    if (!email || !password) {
      console.error('Usage: node scripts/create-admin.js <email> <password>');
      console.error('       node scripts/create-admin.js --batch');
      process.exit(1);
    }
    await provisionAdmin({ email, password, label: 'Custom Admin' });
    console.log('\n✅  Admin setup complete. User must sign out and back in for the claim to take effect.\n');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('\n❌  Fatal error:', err.message);
  process.exit(1);
});
