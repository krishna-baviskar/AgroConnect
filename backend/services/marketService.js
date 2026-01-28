// backend/services/marketService.js
import axios from 'axios';

// Mock data for fallback when API fails
const mockMarketData = {
  onion: { price: 25, unit: 'kg', trend: 'up', lastUpdated: new Date().toISOString() },
  tomato: { price: 30, unit: 'kg', trend: 'down', lastUpdated: new Date().toISOString() },
  potato: { price: 20, unit: 'kg', trend: 'stable', lastUpdated: new Date().toISOString() },
  wheat: { price: 2500, unit: 'quintal', trend: 'up', lastUpdated: new Date().toISOString() },
  rice: { price: 3000, unit: 'quintal', trend: 'stable', lastUpdated: new Date().toISOString() },
  cotton: { price: 7000, unit: 'quintal', trend: 'up', lastUpdated: new Date().toISOString() },
  soybean: { price: 4500, unit: 'quintal', trend: 'down', lastUpdated: new Date().toISOString() },
  sugarcane: { price: 300, unit: 'quintal', trend: 'stable', lastUpdated: new Date().toISOString() }
};

// In-memory cache
let marketCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getMarketPrices(crop, state = 'maharashtra') {
  try {
    const cacheKey = `${crop}_${state}`;
    const now = Date.now();

    // Check cache
    if (marketCache[cacheKey] && (now - marketCache[cacheKey].timestamp) < CACHE_DURATION) {
      console.log(`Cache hit for ${cacheKey}`);
      return marketCache[cacheKey].data;
    }

    // Try real API first (data.gov.in or AGMARKNET)
    // Note: Replace with actual API endpoint when available
    const apiUrl = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`;
    
    try {
      const response = await axios.get(apiUrl, {
        params: {
          'api-key': process.env.GOV_API_KEY,
          format: 'json',
          filters: {
            commodity: crop,
            state: state
          }
        },
        timeout: 5000
      });

      if (response.data && response.data.records && response.data.records.length > 0) {
        const record = response.data.records[0];
        const marketData = {
          crop: crop,
          state: state,
          price: parseFloat(record.modal_price || record.min_price),
          unit: 'quintal',
          market: record.market,
          trend: calculateTrend(record),
          lastUpdated: new Date().toISOString(),
          source: 'AGMARKNET'
        };

        // Update cache
        marketCache[cacheKey] = {
          data: marketData,
          timestamp: now
        };

        return marketData;
      }
    } catch (apiError) {
      console.log('API call failed, using fallback data:', apiError.message);
    }

    // Fallback to mock data
    const cropLower = crop.toLowerCase();
    if (mockMarketData[cropLower]) {
      const marketData = {
        crop: crop,
        state: state,
        ...mockMarketData[cropLower],
        source: 'Estimated',
        note: 'Real-time data unavailable. Showing estimated prices.'
      };

      // Cache fallback data too
      marketCache[cacheKey] = {
        data: marketData,
        timestamp: now
      };

      return marketData;
    }

    throw new Error('Crop not found in database');

  } catch (error) {
    console.error('Market service error:', error);
    throw error;
  }
}

export async function getAllMarketPrices(state = 'maharashtra') {
  try {
    const crops = Object.keys(mockMarketData);
    const prices = await Promise.all(
      crops.map(crop => getMarketPrices(crop, state).catch(() => null))
    );

    return prices.filter(p => p !== null);
  } catch (error) {
    console.error('Get all prices error:', error);
    throw error;
  }
}

function calculateTrend(record) {
  // Simple trend calculation
  if (record.modal_price && record.min_price) {
    const diff = parseFloat(record.modal_price) - parseFloat(record.min_price);
    if (diff > 0) return 'up';
    if (diff < 0) return 'down';
  }
  return 'stable';
}

export default { getMarketPrices, getAllMarketPrices };