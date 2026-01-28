// backend/routes/weather.js
import express from 'express';
import { getCurrentWeather, getForecast, generateAdvisory } from '../services/weatherService.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Get current weather (protected)
router.get('/current', verifyToken, async (req, res) => {
  try {
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({ 
        error: 'Location parameter is required'
      });
    }

    const weather = await getCurrentWeather(location);

    res.json({
      success: true,
      data: weather
    });

  } catch (error) {
    console.error('Current weather error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch current weather',
      message: error.message
    });
  }
});

// Get 5-day forecast (protected)
router.get('/forecast', verifyToken, async (req, res) => {
  try {
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({ 
        error: 'Location parameter is required'
      });
    }

    const forecast = await getForecast(location);

    res.json({
      success: true,
      count: forecast.length,
      data: forecast
    });

  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather forecast',
      message: error.message
    });
  }
});

// Get weather advisory (protected)
router.get('/advisory', verifyToken, async (req, res) => {
  try {
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({ 
        error: 'Location parameter is required'
      });
    }

    const [currentWeather, forecast] = await Promise.all([
      getCurrentWeather(location),
      getForecast(location)
    ]);

    const advisories = generateAdvisory(currentWeather, forecast);

    res.json({
      success: true,
      location: location,
      currentWeather,
      advisories
    });

  } catch (error) {
    console.error('Weather advisory error:', error);
    res.status(500).json({ 
      error: 'Failed to generate weather advisory',
      message: error.message
    });
  }
});

export default router;