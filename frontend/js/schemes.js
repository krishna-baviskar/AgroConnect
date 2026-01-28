// frontend/js/schemes.js
import { API_URL } from './config.js';

export async function fetchSchemes(authToken, category = '') {
    try {
        let url = `${API_URL}/schemes?state=maharashtra`;
        if (category) url += `&category=${category}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Load schemes error:', error);
        return [];
    }
}
