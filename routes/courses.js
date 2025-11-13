const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { verifyFirebaseToken: verifyToken } = require('../middleware/auth');


// -----------------------
// GET ALL COURSES FOR INSTITUTE
// -----------------------
router.get('/courses', verifyToken, async (req, res) => {
  const uid = req.user.uid;

  try {
    const snap = await db
      .collection('courses')
      .where('instituteId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const courses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, courses });
  } catch (err) {
    console.error('Fetch courses error:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// -----------------------
// ADD COURSE
// -----------------------
router.post('/courses', verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const { name, faculty, duration, intake } = req.body;

  if (!name || !faculty || !duration) {
    return res.status(400).json({ error: 'Name, faculty, and duration are required' });
  }

  try {
    const newCourse = {
      name,
      faculty,
      duration,
      intake: intake || '',
      instituteId: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('courses').add(newCourse);
    res.json({ success: true, id: docRef.id, ...newCourse });
  } catch (err) {
    console.error('Add course error:', err);
    res.status(500).json({ error: 'Failed to add course' });
  }
});

// -----------------------
// UPDATE COURSE
// -----------------------
router.put('/courses/:id', verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const { id } = req.params;
  const { name, faculty, duration, intake } = req.body;

  if (!name || !faculty || !duration) {
    return res.status(400).json({ error: 'Name, faculty, and duration are required' });
  }

  try {
    const courseRef = db.collection('courses').doc(id);
    const snap = await courseRef.get();

    if (!snap.exists) return res.status(404).json({ error: 'Course not found' });
    if (snap.data().instituteId !== uid) return res.status(403).json({ error: 'Unauthorized' });

    await courseRef.update({
      name,
      faculty,
      duration,
      intake: intake || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, message: 'Course updated' });
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// -----------------------
// DELETE COURSE
// -----------------------
router.delete('/courses/:id', verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const { id } = req.params;

  try {
    const courseRef = db.collection('courses').doc(id);
    const snap = await courseRef.get();

    if (!snap.exists) return res.status(404).json({ error: 'Course not found' });
    if (snap.data().instituteId !== uid) return res.status(403).json({ error: 'Unauthorized' });

    await courseRef.delete();
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

module.exports = router;
