// frontend/js/market.js
import { API_URL } from './config.js';

export async function fetchMarketPrices(authToken, state = 'maharashtra') {
    try {
        const response = await fetch(`${API_URL}/market/prices?state=${state}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Load market prices error:', error);
        return [];
    }
}

export async function fetchRecommendations(authToken) {
    try {
        const response = await fetch(`${API_URL}/market/recommendations`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();

        if (data.success) {
            console.log('✅ Recommendations loaded:', data.recommendations?.length || 0);
            return data.recommendations || [];
        }
        return [];
    } catch (error) {
        console.error('Load recommendations error:', error);
        return [];
    }
}
