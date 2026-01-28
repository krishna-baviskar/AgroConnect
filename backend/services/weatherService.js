// backend/services/weatherService.js
import axios from 'axios';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// In-memory cache
let weatherCache = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function getCurrentWeather(location) {
  try {
    const cacheKey = `current_${location}`;
    const now = Date.now();

    // Check cache
    if (weatherCache[cacheKey] && (now - weatherCache[cacheKey].timestamp) < CACHE_DURATION) {
      return weatherCache[cacheKey].data;
    }

    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: location,
        appid: OPENWEATHER_API_KEY,
        units: 'metric'
      },
      timeout: 5000
    });

    const data = response.data;
    const weatherData = {
      location: data.name,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    weatherCache[cacheKey] = {
      data: weatherData,
      timestamp: now
    };

    return weatherData;

  } catch (error) {
    console.error('Current weather error:', error.message);
    throw new Error('Failed to fetch current weather');
  }
}

export async function getForecast(location) {
  try {
    const cacheKey = `forecast_${location}`;
    const now = Date.now();

    // Check cache
    if (weatherCache[cacheKey] && (now - weatherCache[cacheKey].timestamp) < CACHE_DURATION) {
      return weatherCache[cacheKey].data;
    }

    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        q: location,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        cnt: 40 // 5 days (8 * 5 = 40 3-hour intervals)
      },
      timeout: 5000
    });

    const data = response.data;
    
    // Group by day and get one forecast per day
    const dailyForecasts = {};
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date: date,
          temp: Math.round(item.main.temp),
          tempMin: Math.round(item.main.temp_min),
          tempMax: Math.round(item.main.temp_max),
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
          rain: item.rain ? item.rain['3h'] || 0 : 0
        };
      }
    });

    const forecast = Object.values(dailyForecasts).slice(0, 5);

    // Cache the result
    weatherCache[cacheKey] = {
      data: forecast,
      timestamp: now
    };

    return forecast;

  } catch (error) {
    console.error('Forecast error:', error.message);
    throw new Error('Failed to fetch weather forecast');
  }
}

export function generateAdvisory(currentWeather, forecast) {
  const advisories = [];

  // Temperature-based advisory
  if (currentWeather.temperature > 35) {
    advisories.push({
      type: 'warning',
      icon: '🌡️',
      title: 'High Temperature Alert',
      message: 'Increase irrigation frequency. Protect crops from heat stress.',
      action: 'Apply mulching and provide shade for sensitive crops'
    });
  } else if (currentWeather.temperature < 15) {
    advisories.push({
      type: 'info',
      icon: '❄️',
      title: 'Low Temperature',
      message: 'Protect sensitive crops from cold. Frost possible.',
      action: 'Cover crops at night if temperature drops below 10°C'
    });
  }

  // Humidity-based advisory
  if (currentWeather.humidity > 80) {
    advisories.push({
      type: 'warning',
      icon: '💧',
      title: 'High Humidity',
      message: 'Risk of fungal diseases. Avoid pesticide spraying.',
      action: 'Monitor crops for fungal infections and ensure good ventilation'
    });
  }

  // Rain-based advisory from forecast
  const rainyDays = forecast.filter(day => day.rain > 0);
  if (rainyDays.length >= 3) {
    advisories.push({
      type: 'info',
      icon: '🌧️',
      title: 'Rain Expected',
      message: `Rain predicted for ${rainyDays.length} days. Postpone spraying.`,
      action: 'Delay pesticide application and check drainage systems'
    });
  } else if (rainyDays.length === 0) {
    advisories.push({
      type: 'info',
      icon: '☀️',
      title: 'Clear Weather Ahead',
      message: 'Good conditions for spraying and field operations.',
      action: 'Plan pesticide application and field maintenance activities'
    });
  }

  // Wind-based advisory
  if (currentWeather.windSpeed > 10) {
    advisories.push({
      type: 'warning',
      icon: '💨',
      title: 'Strong Winds',
      message: 'Avoid pesticide spraying. Support tall crops.',
      action: 'Secure crop support structures and delay spray operations'
    });
  }

  return advisories;
}

export default { getCurrentWeather, getForecast, generateAdvisory };