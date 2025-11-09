// config/firebase.js
require('dotenv').config();
const admin = require('firebase-admin');

let serviceAccount;
try {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT missing');
  serviceAccount = JSON.parse(raw);
} catch (err) {
  console.error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
  console.error(err.message);
  process.exit(1);
}

if (!serviceAccount.project_id || !serviceAccount.private_key) {
  console.error('Service account missing project_id or private_key');
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin SDK initialized');
} catch (err) {
  console.error('Firebase init failed:', err.message);
  process.exit(1);
}

module.exports = {
  db: admin.firestore(),
  auth: admin.auth(),
  storage: admin.storage(),
  admin,
};