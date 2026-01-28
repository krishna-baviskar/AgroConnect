// backend/routes/market.js
import express from 'express';
import { getMarketPrices, getAllMarketPrices } from '../services/marketService.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Get specific crop price (protected)
router.get('/price', verifyToken, async (req, res) => {
  try {
    const { crop, state } = req.query;

    if (!crop) {
      return res.status(400).json({
        error: 'Crop parameter is required'
      });
    }

    const priceData = await getMarketPrices(crop, state || 'maharashtra');

    res.json({
      success: true,
      data: priceData
    });

  } catch (error) {
    console.error('Market price error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Crop not found in database'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch market prices'
    });
  }
});

// Get all market prices (protected)
router.get('/prices', verifyToken, async (req, res) => {
  try {
    const { state } = req.query;

    const prices = await getAllMarketPrices(state || 'maharashtra');

    res.json({
      success: true,
      count: prices.length,
      data: prices
    });

  } catch (error) {
    console.error('Get all prices error:', error);
    res.status(500).json({
      error: 'Failed to fetch market prices'
    });
  }
});

// Get crop recommendations based on market prices
router.get('/recommendations', verifyToken, async (req, res) => {
  try {
    const prices = await getAllMarketPrices('maharashtra');

    // Filter crops with upward trend and good prices
    const recommended = prices
      .filter(p => p.trend === 'up' || (p.trend === 'stable' && p.price > 2000))
      .sort((a, b) => b.price - a.price)
      .slice(0, 5);

    res.json({
      success: true,
      message: 'Top crop recommendations based on current market trends',
      recommendations: recommended
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations'
    });
  }
});

export default router;