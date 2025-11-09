const express = require('express');
const router = express.Router();
const { db, auth, admin } = require('../config/firebase');
const { sendVerificationEmail } = require('../utils/email');
const fetch = require('node-fetch');

// -----------------------
// REGISTER
// -----------------------
router.post('/register', async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  const { email, password, fullName, role, phone, institutionName } = req.body;

  if (!email || !password || !fullName || !role) {
    return res.status(400).json({ error: 'Email, password, fullName, and role are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // 1. Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
      phoneNumber: phone || null,
      emailVerified: false,
    });

    // 2. Save to Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      fullName,
      role,
      phone: phone || '',
      institutionName: institutionName || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: false,
    });

    // 3. Generate verification link
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/verify-email?email=${encodeURIComponent(email)}&role=${role}`,
      handleCodeInApp: true,
    };
    const verificationLink = await auth.generateEmailVerificationLink(email, actionCodeSettings);

    // 4. Send email
    const emailResult = await sendVerificationEmail(email, verificationLink, fullName, role);

    // 5. Response
    const response = {
      message: 'Account created! Please check your email to verify.',
      uid: userRecord.uid,
      role,
      emailSent: emailResult.success,
    };

    if (process.env.NODE_ENV === 'development') {
      response.verificationLink = verificationLink;
    }

    if (!emailResult.success) {
      response.note = 'Email failed to send. Contact support.';
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Register error:', error);
    if (error.code) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// -----------------------
// LOGIN
// -----------------------
router.post('/login', async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const firebaseUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`;
    const resp = await fetch(firebaseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    const data = await resp.json();

    if (data.error) {
      const msg = data.error.message === 'INVALID_LOGIN_CREDENTIALS'
        ? 'Invalid email or password'
        : data.error.message;
      return res.status(401).json({ error: msg });
    }

    const { localId: uid, idToken } = data;

    // Check email verification
    const adminUser = await auth.getUser(uid);
    if (!adminUser.emailVerified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }

    // Get user from Firestore
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userData = userSnap.data();

    // Sync Firestore
    if (!userData.emailVerified) {
      await db.collection('users').doc(uid).update({
        emailVerified: true,
        emailVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.json({
      message: 'Login successful!',
      uid,
      role: userData.role,
      token: idToken,
      user: {
        email: userData.email,
        fullName: userData.fullName,
        phone: userData.phone,
        institutionName: userData.institutionName,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// -----------------------
// REFRESH TOKEN
// -----------------------
router.post('/refresh-token', async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: 'UID required' });

  try {
    const user = await auth.getUser(uid);
    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Email not verified' });
    }
    const token = await auth.createCustomToken(uid);
    res.json({ token });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// -----------------------
// CHECK VERIFICATION (for polling)
// -----------------------
router.post('/check-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const user = await auth.getUserByEmail(email);
    res.json({ verified: user.emailVerified });
  } catch (err) {
    res.status(400).json({ verified: false });
  }
});

// -----------------------
// RESEND VERIFICATION EMAIL
// -----------------------
router.post('/resend-verification', async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) return res.status(400).json({ error: 'Email and role required' });

  try {
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/verify-email?email=${encodeURIComponent(email)}&role=${role}`,
      handleCodeInApp: true,
    };
    const link = await auth.generateEmailVerificationLink(email, actionCodeSettings);
    const result = await sendVerificationEmail(email, link, "User", role);
    res.json({ success: result.success });
  } catch (err) {
    console.error('Resend error:', err);
    res.status(500).json({ error: 'Failed to resend email' });
  }
});

// -----------------------
// USER PROFILE (for VerifyEmail.jsx)
// -----------------------
router.get('/users/profile', async (req, res) => {
  // This assumes you have verifyFirebaseToken middleware
  // If not, add it: router.use(verifyFirebaseToken);
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return res.status(404).json({ error: 'Profile not found' });

    const data = snap.data();
    res.json({
      fullName: data.fullName || data.name,
      email: data.email,
      role: data.role,
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// -----------------------
// VERIFY EMAIL (OOB Code)
// -----------------------
router.post('/verify-email', async (req, res) => {
  const { oobCode } = req.body;
  if (!oobCode) return res.status(400).json({ error: 'Verification code is required' });

  try {
    const email = await auth.applyActionCode(oobCode);
    const userRecord = await auth.getUserByEmail(email);

    await db.collection('users').doc(userRecord.uid).update({
      emailVerified: true,
      emailVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      message: 'Email verified successfully!',
      uid: userRecord.uid,
      email: userRecord.email,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    const errorMessages = {
      'auth/expired-action-code': 'Verification link has expired.',
      'auth/invalid-action-code': 'Invalid or already used link.',
      'auth/user-disabled': 'Account disabled.',
      'auth/user-not-found': 'No account found.',
    };
    const message = errorMessages[error.code] || 'Email verification failed.';
    res.status(400).json({ error: message });
  }
});

module.exports = router;