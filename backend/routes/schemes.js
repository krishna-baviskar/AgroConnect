// backend/routes/schemes.js
import express from 'express';
import { getSchemes, getSchemeById, getSchemeCategories } from '../services/schemeService.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Get all schemes with optional filters (protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { state, crop, farmerType, category } = req.query;

    const filters = {};
    if (crop) filters.crop = crop;
    if (farmerType) filters.farmerType = farmerType;
    if (category) filters.category = category;

    const schemes = await getSchemes(state || 'maharashtra', filters);

    res.json({
      success: true,
      count: schemes.length,
      filters: filters,
      data: schemes
    });

  } catch (error) {
    console.error('Get schemes error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch schemes'
    });
  }
});

// Get specific scheme by ID (protected)
router.get('/:schemeId', verifyToken, async (req, res) => {
  try {
    const { schemeId } = req.params;
    const { state } = req.query;

    const scheme = await getSchemeById(schemeId, state || 'maharashtra');

    res.json({
      success: true,
      data: scheme
    });

  } catch (error) {
    console.error('Get scheme error:', error);
    
    if (error.message === 'Scheme not found') {
      return res.status(404).json({ 
        error: 'Scheme not found'
      });
    }

    res.status(500).json({ 
      error: 'Failed to fetch scheme details'
    });
  }
});

// Get scheme categories (protected)
router.get('/meta/categories', verifyToken, async (req, res) => {
  try {
    const categories = getSchemeCategories();

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories'
    });
  }
});

export default router;