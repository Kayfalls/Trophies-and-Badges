#!/usr/bin/env node
// =============================================================
// CREATE ADMIN — Sets up a Firebase Auth user with admin claims
// =============================================================
// Usage:
//   1. Set FIREBASE_SERVICE_ACCOUNT env var (JSON string of your service account key)
//   2. Run: node scripts/create-admin.js <email> <password>
//
// Example:
//   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}' \
//     node scripts/create-admin.js kabelomaile73@gmail.com MySecurePassword123
// =============================================================

const admin = require('firebase-admin');

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('Error: FIREBASE_SERVICE_ACCOUNT environment variable is required.');
  console.error('Set it to the JSON string of your Firebase service account key.');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.js <email> <password>');
  console.error('Example: node scripts/create-admin.js kabelomaile73@gmail.com MySecurePassword123');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createAdmin() {
  try {
    // Check if user already exists
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log(`User already exists: ${user.uid}`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // Create the user
        user = await admin.auth().createUser({
          email,
          password,
          emailVerified: true
        });
        console.log(`User created: ${user.uid}`);
      } else {
        throw err;
      }
    }

    // Set admin custom claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Admin claim set for ${email}`);

    // Verify email if not already verified
    if (!user.emailVerified) {
      await admin.auth().updateUser(user.uid, { emailVerified: true });
      console.log('Email marked as verified.');
    }

    console.log('\nAdmin setup complete!');
    console.log(`Email: ${email}`);
    console.log('You can now sign in at the admin portal.');

    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();
