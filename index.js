require('dotenv').config();
const express = require('express');
const cors = require('cors');


const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const fileRoutes = require('./routes/file');
const coursesRoutes = require('./routes/courses');

const app = express(); 

// === MIDDLEWARE ===
app.use(cors({
  origin: ['https://career-guidance-gilt.vercel.app', 'http://localhost:5173', 'https://career-guidance-gilt.vercel.app/'],
  credentials: true
}));
app.use(express.json());

// Mount routes
app.use('/api', coursesRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/file', fileRoutes);

// === HEALTH CHECK ===
app.get('/', (req, res) => {
  let serviceAccount = null;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (raw && raw.trim().startsWith('{')) {
      serviceAccount = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Warning: Invalid FIREBASE_SERVICE_ACCOUNT in .env');
  }

  res.json({
    message: 'CareerGuide Backend Running',
    timestamp: new Date().toISOString(),
    project: serviceAccount?.project_id || 'unknown',
    email: process.env.EMAIL_USER || 'not set',
    endpoints: {
      register: 'POST /auth/register',
      login: 'POST /auth/login',
      avatar: 'POST /file/upload-avatar',
      document: 'POST /file/upload-document',
      deleteDoc: 'POST /file/delete-document',
    },
  });
});

// === 404 HANDLER ===
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'POST /auth/register',
      'POST /auth/login', 
      'POST /file/upload-avatar',
      'POST /file/upload-document',
      'POST /file/delete-document'
    ]
  });
});

// === ERROR HANDLER ===
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\nCareerGuide Backend LIVE`);
  console.log(`==============================`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Project: ${process.env.FIREBASE_PROJECT_ID || 'unknown'}`);
  console.log(`Email: ${process.env.EMAIL_USER || 'not set'}`);
  console.log(`Env: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==============================\n`);
});
