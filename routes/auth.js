const express = require('express');
const router = express.Router();
const { db, auth, admin } = require('../config/firebase');
const { sendEmail, SENDER_EMAIL } = require('../config/sendgrid');
const fetch = require('node-fetch');

// ─────────────────────── REGISTER ───────────────────────
router.post('/register', async (req, res) => {
  if (!req.body) return res.status(400).json({ error: 'Request body is missing' });

  const { email, password, fullName, role, phone, institutionName } = req.body;

  if (!email || !password || !fullName || !role)
    return res.status(400).json({ error: 'Email, password, fullName, and role are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
      phoneNumber: phone || null,
      emailVerified: false,
    });

    await db.collection('users').doc(userRecord.uid).set({
      email,
      fullName,
      role,
      phone: phone || '',
      institutionName: institutionName || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: false,
    });

    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/verify-email?email=${encodeURIComponent(email)}&role=${role}`,
      handleCodeInApp: true,
    };
    const verificationLink = await auth.generateEmailVerificationLink(email, actionCodeSettings);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #eee;">
        <div style="background:#000; color:#fff; padding:30px; text-align:center;">
          <h1>CareerGuide LESOTHO</h1>
          <p>Email Verification Required</p>
        </div>
        <div style="padding:30px; background:#f9f9f9;">
          <h2>Welcome, ${fullName}!</h2>
          <p>You registered as a <strong>${role}</strong>.</p>
          <p>Click below to verify your email:</p>
          <div style="text-align:center; margin:20px 0;">
            <a href="${verificationLink}" style="background:#000; color:#fff; padding:14px 35px; text-decoration:none; border-radius:8px; font-weight:bold;">Verify Email</a>
          </div>
          <p>Or copy this link: <code style="background:#eee; padding:10px; font-size:12px; word-break:break-all;">${verificationLink}</code></p>
          <p><strong>Expires in 24 hours.</strong></p>
        </div>
        <div style="text-align:center; padding:20px; color:#666; font-size:12px;">
          &copy; ${new Date().getFullYear()} CareerGuide LESOTHO<br>
          Maseru, Lesotho<br>
          Contact: ${SENDER_EMAIL}
        </div>
      </div>
    `;

    const textFallback = `Hello ${fullName}, please verify your ${role} account using this link: ${verificationLink}`;
    await sendEmail(email, 'Verify Your Email - CareerGuide LESOTHO', textFallback, emailHtml);

    const response = {
      message: 'Account created! Please check your email to verify.',
      uid: userRecord.uid,
      role,
      emailSent: true,
    };

    if (process.env.NODE_ENV === 'development') {
      response.verificationLink = verificationLink;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Register error:', error);
    const status = error.code ? 400 : 500;
    res.status(status).json({ error: error.message || 'Registration failed' });
  }
});

// ─────────────────────── LOGIN ───────────────────────
router.post('/login', async (req, res) => {
  if (!req.body) return res.status(400).json({ error: 'Request body is missing' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const firebaseUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`;
    const resp = await fetch(firebaseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const data = await resp.json();

    if (data.error) {
      const msg = data.error.message === 'INVALID_LOGIN_CREDENTIALS'
        ? 'Invalid email or password'
        : data.error.message;
      return res.status(401).json({ error: msg });
    }

    const { localId: uid, idToken } = data;
    const adminUser = await auth.getUser(uid);

    if (!adminUser.emailVerified)
      return res.status(403).json({ error: 'Please verify your email before logging in.' });

    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) return res.status(404).json({ error: 'User profile not found' });

    const userData = userSnap.data();

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

// ─────────────────────── RESEND VERIFICATION ───────────────────────
router.post('/resend-verification', async (req, res) => {
  const { email, role, fullName } = req.body;
  if (!email || !role) return res.status(400).json({ error: 'Email and role required' });

  try {
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/verify-email?email=${encodeURIComponent(email)}&role=${role}`,
      handleCodeInApp: true,
    };
    const link = await auth.generateEmailVerificationLink(email, actionCodeSettings);

    const emailHtml = `
      <p>Hello ${fullName || 'User'},</p>
      <p>Please verify your ${role} account by clicking the link below:</p>
      <a href="${link}" style="padding:10px 20px; background:#000; color:#fff; text-decoration:none; border-radius:5px;">Verify Email</a>
      <p style="font-size:12px; color:#666;">&copy; ${new Date().getFullYear()} CareerGuide LESOTHO | Maseru, Lesotho | Contact: ${SENDER_EMAIL}</p>
    `;

    const textFallback = `Hello ${fullName || 'User'}, please verify your ${role} account using this link: ${link}`;
    await sendEmail(email, 'Verify Your Email - CareerGuide LESOTHO', textFallback, emailHtml);

    res.json({ success: true });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Failed to resend email' });
  }
});

// ─────────────────────── CHECK VERIFICATION ───────────────────────
router.post('/check-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const userRecord = await auth.getUserByEmail(email);
    const emailVerified = userRecord.emailVerified;

    const userSnap = await db.collection('users').doc(userRecord.uid).get();
    let role = 'student';
    let fullName = userRecord.displayName || '';

    if (userSnap.exists) {
      const data = userSnap.data();
      role = data.role || role;
      fullName = data.fullName || fullName;
    }

    res.json({ verified: emailVerified, role, fullName });
  } catch (err) {
    console.error('Check verification error:', err);
    res.status(500).json({ error: 'Failed to check verification' });
  }
});

module.exports = router;
