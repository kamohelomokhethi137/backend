
require("dotenv").config();
const admin = require("firebase-admin");
const path = require("path");


const serviceAccountPath = path.resolve(
  __dirname,
  "../carear-64cbe-firebase-adminsdk-fbsvc-2062b7d168.json"
);

try {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
  });
  console.log("Firebase Admin SDK initialized successfully");
} catch (err) {
  console.error("Firebase initialization failed:", err.message);
  process.exit(1);
}

module.exports = {
  db: admin.firestore(),
  auth: admin.auth(),
  storage: admin.storage(),
  admin,
};
