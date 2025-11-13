// scripts/quickAdmin.js
const { auth, db } = require('../config/firebase');

const quickAdmin = async () => {
  try {
    const user = await auth.createUser({
      email: 'admin@career.com',
      password: 'admin123', 
      displayName: 'Admin User',
      emailVerified: true // This auto-verifies the email
    });

    // Create user document in users collection
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: 'admin@career.com',
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date(),
      emailVerified: true
    });

    // Also create document in admin collection
    await db.collection('admins').doc(user.uid).set({
      uid: user.uid,
      email: 'admin@career.com', 
      name: 'Admin User',
      role: 'super_admin',
      permissions: ['manage_users', 'manage_institutes', 'manage_jobs', 'view_analytics'],
      createdAt: new Date(),
      status: 'active',
      emailVerified: true
    });

    console.log('Admin created successfully!');
    console.log('Email: admin@career.com');
    console.log('Password: admin123');
    console.log(' UID:', user.uid);
    console.log(' Email automatically verified');
    console.log(' Added to: users collection & admins collection');
    
  } catch (error) {
    console.error(' Error:', error.message);
  }
};

quickAdmin().then(() => process.exit(0));