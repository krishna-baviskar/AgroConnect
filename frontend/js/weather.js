// frontend/js/weather.js
import { API_URL } from './config.js';

export async function fetchCurrentWeather(authToken, location) {
    try {
        const response = await fetch(`${API_URL}/weather/current?location=${location}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        return data.success ? data.data : null;
    } catch (error) {
        console.error('Load current weather error:', error);
        return null;
    }
}

export async function fetchWeatherForecast(authToken, location) {
    try {
        const response = await fetch(`${API_URL}/weather/forecast?location=${location}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Load forecast error:', error);
        return [];
    }
}

export async function fetchWeatherAdvisory(authToken, location) {
    try {
        const response = await fetch(`${API_URL}/weather/advisory?location=${location}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        return data; // Return full object as it contains multiple things
    } catch (error) {
        console.error('Load advisory error:', error);
        return null;
    }
}
