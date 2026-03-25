// =============================================================
// CLOUD FUNCTIONS — Trophies & Badges Backend
// =============================================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// ─── ENVIRONMENT VARIABLES ──────────────────────────────────
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "kabelomaile73@gmail.com";


// =============================================================
// 3. setAdminClaim — Callable function
//    Sets the { admin: true } custom claim on a Firebase Auth user.
//    Restricted: only existing admins or first-time setup.
// =============================================================
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  const { targetUid } = data;

  if (!targetUid) {
    throw new functions.https.HttpsError("invalid-argument", "targetUid is required.");
  }

  // Allow if caller is already admin, or if no admin exists yet (first-time setup)
  if (context.auth) {
    const callerToken = context.auth.token;

    if (callerToken.admin === true) {
      // Existing admin — allow
    } else {
      // Check if the caller's email matches ADMIN_EMAIL for first-time setup
      const callerEmail = callerToken.email || "";
      if (callerEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        throw new functions.https.HttpsError("permission-denied", "Only admins can set admin claims.");
      }
    }
  } else {
    throw new functions.https.HttpsError("unauthenticated", "You must be signed in.");
  }

  // Set admin claim
  await admin.auth().setCustomUserClaims(targetUid, { admin: true });

  functions.logger.info("Admin claim set", { targetUid, setBy: context.auth.uid });

  return { success: true, message: "Admin claim set. User must re-login for it to take effect." };
});


