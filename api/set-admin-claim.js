const admin = require('./_lib/firebase-admin');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { targetUid } = req.body;
  const authHeader = req.headers.authorization;

  if (!targetUid) {
    return res.status(400).json({ error: 'targetUid is required.' });
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const callerEmail = decodedToken.email || "";
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "kabelomaile73@gmail.com";

    // Allow if caller is already admin, or if caller email matches ADMIN_EMAIL
    if (decodedToken.admin === true || callerEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      await admin.auth().setCustomUserClaims(targetUid, { admin: true });
      return res.status(200).json({ success: true, message: 'Admin claim set.' });
    } else {
      return res.status(403).json({ error: 'Permission denied.' });
    }
  } catch (error) {
    console.error('Error setting admin claim:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
