const { admin } = require('../config/firebase');

const verifyFirebaseToken = async (req, res, next) => {
  const header = req.headers.authorization;
  console.log("Auth Header:", header);

  if (!header?.startsWith('Bearer ')) {
    console.log(" Missing or malformed token header");
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split('Bearer ')[1].trim();
  console.log("Extracted Token:", token.substring(0, 20) + "..."); 
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    console.log(" Token verified for UID:", decoded.uid);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { verifyFirebaseToken };
