require("dotenv").config();
const admin = require("firebase-admin");

// Build service account object from environment variables
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // optional if you use storage
    });
  }
  console.log("Firebase Admin SDK initialized successfully");
} catch (err) {
  console.error("Firebase initialization failed:", err.message, err);
  process.exit(1);
}

module.exports = {
  db: admin.firestore(),
  auth: admin.auth(),
  storage: admin.storage(),
  admin,
};
