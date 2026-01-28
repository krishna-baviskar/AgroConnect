// backend/routes/farmers.js
import express from 'express';
import { collections, timestamp } from '../config/firebase.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Get farmer profile (protected)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;

    const farmerDoc = await collections.farmers().doc(uid).get();

    if (!farmerDoc.exists) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    res.json({
      success: true,
      farmer: farmerDoc.data()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile'
    });
  }
});

// Update farmer profile (protected)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, phone, village, state, landSize, soilType } = req.body;

    const updateData = {
      updatedAt: timestamp()
    };

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (village) updateData.village = village;
    if (state) updateData.state = state;
    if (landSize !== undefined) updateData.landSize = parseFloat(landSize);
    if (soilType) updateData.soilType = soilType;

    await collections.farmers().doc(uid).update(updateData);

    const updatedDoc = await collections.farmers().doc(uid).get();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      farmer: updatedDoc.data()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile'
    });
  }
});

// Get crop plans (protected)
router.get('/crop-plans', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;

    const plansSnapshot = await collections.cropPlans()
      .where('uid', '==', uid)
      .get();

    const plans = [];
    plansSnapshot.forEach(doc => {
      plans.push({ id: doc.id, ...doc.data() });
    });

    // Sort by createdAt on the server side (client-side sorting)
    plans.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime; // Descending order
    });

    res.json({
      success: true,
      plans
    });

  } catch (error) {
    console.error('Get crop plans error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({
      error: 'Failed to fetch crop plans',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create crop plan (protected)
router.post('/crop-plans', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const {
      cropName,
      season,
      soilType,
      landSize,
      sowingDate,
      expectedHarvest,
      irrigationType,
      waterAvailability,
      previousCrop,
      farmingMethod,
      expectedYield,
      budget,
      notes
    } = req.body;

    if (!cropName || !season) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['cropName', 'season']
      });
    }

    const planData = {
      uid,
      cropName,
      season,
      soilType: soilType || '',
      landSize: parseFloat(landSize) || 0,
      sowingDate: sowingDate || null,
      expectedHarvest: expectedHarvest || null,
      irrigationType: irrigationType || '',
      waterAvailability: waterAvailability || '',
      previousCrop: previousCrop || '',
      farmingMethod: farmingMethod || '',
      expectedYield: parseFloat(expectedYield) || 0,
      budget: parseFloat(budget) || 0,
      notes: notes || '',
      status: 'active',
      createdAt: timestamp()
    };

    const docRef = await collections.cropPlans().add(planData);

    res.status(201).json({
      success: true,
      message: 'Crop plan created successfully',
      plan: { id: docRef.id, ...planData }
    });

  } catch (error) {
    console.error('Create crop plan error:', error);
    res.status(500).json({
      error: 'Failed to create crop plan'
    });
  }
});

// Delete crop plan (protected)
router.delete('/crop-plans/:planId', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { planId } = req.params;

    const planDoc = await collections.cropPlans().doc(planId).get();

    if (!planDoc.exists) {
      return res.status(404).json({
        error: 'Crop plan not found'
      });
    }

    // Verify ownership
    if (planDoc.data().uid !== uid) {
      return res.status(403).json({
        error: 'Unauthorized to delete this plan'
      });
    }

    await collections.cropPlans().doc(planId).delete();

    res.json({
      success: true,
      message: 'Crop plan deleted successfully'
    });

  } catch (error) {
    console.error('Delete crop plan error:', error);
    res.status(500).json({
      error: 'Failed to delete crop plan'
    });
  }
});

export default router;