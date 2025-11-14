require("dotenv").config();
const admin = require("firebase-admin");

const serviceAccount = {
  "type": "service_account",
  "project_id": "carear-64cbe",
  "private_key_id": "5a20628af19c247c816ad876c499717b3dd20b0d",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDEtrRyEmSUP23D\nAiYpA2HyHjtmlhw+QvN/s4TcC9XUDZXCBAcvY14bhibF6U4a9pnKchAOoNAkM5Ni\nFJI5e6hhh29jMeoZZahV7gpGksJC3YnGh9GzQm1grcs5to232NDCI0BapPQFYVM/\nugGJ1/uInBPA/RB6+S1Kh3iT1QRTwGvUJYdF8tRexUGLWQJi79cbJTLZ+1WlQZ7j\n/1rnpQf/YyE1yh8lI+nxCsE71cKy91inkP2ag2+43lFcGiWVblQ5TAMdhBAsYpI0\n+Apj0BdauWwE80DFHF6qcz37mDm6dYjc7x57wiyDzpU6maGLggI6JIjHSp4K5WPS\nAJutSbO/AgMBAAECggEASSif/GqtwFrEoglrEsbAxxCKS/FY6KjysVQc/c9jA33X\n6/Oejne4uKjQQ7usgiejc6CvKxmQv131Gr2G0l0Uds0tVmlqZG6jx+2DIdMT71VA\nF7dMfIwgbJvGIJ0toKnAnesJVIzTeirDkMhHKTJLyHcve49CcVG5j+XJKMXI2bJn\nWWk2gkM/wyzGFnoBYcBXUZVUgbtywTleIbBeHYz9HDhC7/MiNkUhsACI1VsgC8dn\n+LGoeoLhSowzWBmAPYII9B/Kczz7ri96Ec65bbGgYQ2hp4i4gXvElfZQ5j6jIUre\nG5IMYrxH/VXVzs+3TbvzvzgcutlUvqu2fS8YrXPuIQKBgQD26KTffAAB3BzXH7iY\nZJl7IPQEiudj11V9AlPvstUQpyxAtlplpHXTXSRf1JBFHjZPAMUSY4abn/jZsP0Q\nfgUitMFMY+eHRKLpbREpKTlFzbrIOc4NhHaR1X4uHAYKzGp6yHwQyMs8EH/QJ0mL\n72v8XxGsZOtDL/c+Vnu6fDADXwKBgQDL9Oxch0LMeiJW5x9UwNllh+D86WGMMyP6\nvEc3Bvb6imZprupaaFiCK9Tvtmnf7HN8D90zNQ/PVF2ZXAwMQL5P1WXzpgtwZO31\nxDOf0NOUMGn9rvt1xGhVqPcyE45oop6ho9/XShqjJpwehO0BpMT9pUx4tY6pDox5\nssUykJ2LoQKBgQDeqUxN0gg7pSFJCu0wWMBkXoJQOmeTDRSmCFxjdDVasDdjIE+D\nC/3Jn1x3Izz7Z9R4CGywOZqha3FB968vmUXOV41d81ZPESGNOfNY2Dky7uV7PU3J\nuOQofYwtzs3QHSoFEhl4FWvZ/dMVhuh3TnFmhOFuQxA6Zd4klF89/FJcJwKBgQC8\nlUF7KKIOGRvpSJkCr7ITm/jfQReuH5cz/qTGb40sCY46R75vS64S5l5kK0FoB+Sc\nILsB3x04MiS9aYvGRJLzlDhJeg13pgsUxI6LRfZsPfuy0fm2YZ2rHqk6RzTU8RBG\nGxUcpmtM0aVm3reaXnS6pv23WwCGtmoTGMYXQ/o4IQKBgQCRdDv0ZeLbfzs70InL\nZ+6bonHJ9pR+9DWYJrww6BceeZnfPx4PUOgwY8CBFAImcpfgaZ3K22Qi3Qp93XOl\no9ANHSnohBMfLxe66a/eLVqlqsh5ZGjmdhmZkB/Ug3VQqph2MCvvoDxdsEXNf5B9\nyHTDC+gN3KJHxbz38YqE0xVn6A==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@carear-64cbe.iam.gserviceaccount.com",
  "client_id": "100736668638754632674",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40carear-64cbe.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
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
