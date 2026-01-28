// backend/routes/auth.js
import express from 'express';
import { auth, collections, timestamp } from '../config/firebase.js';

const router = express.Router();

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, phone, village, state, landSize, soilType } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password', 'name']
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters'
      });
    }

    // Create Firebase user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });

    // Create Firestore farmer profile
    await collections.farmers().doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      phone: phone || '',
      village: village || '',
      state: state || 'Maharashtra',
      landSize: parseFloat(landSize) || 0,
      soilType: soilType || '',
      createdAt: timestamp(),
      updatedAt: timestamp()
    });

    // Generate custom token for auto-login
    const customToken = await auth.createCustomToken(userRecord.uid);

    res.status(201).json({
      message: 'User created successfully',
      uid: userRecord.uid,
      customToken,
      user: {
        uid: userRecord.uid,
        email,
        name
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ 
        error: 'Email already registered'
      });
    }
    
    res.status(500).json({ 
      error: 'Signup failed',
      message: error.message
    });
  }
});

// Get user profile
router.get('/profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    const userDoc = await collections.farmers().doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: userDoc.data()
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile'
    });
  }
});

// Delete user (for testing)
router.delete('/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    // Delete from Firebase Auth
    await auth.deleteUser(uid);
    
    // Delete from Firestore
    await collections.farmers().doc(uid).delete();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      error: 'Failed to delete user'
    });
  }
});

export default router;