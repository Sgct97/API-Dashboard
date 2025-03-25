import { apiRequest, getEnvVariable } from './api';
import { Coordinates } from './weatherService';

export interface AirQualityData {
  aqi: number;
  location: string;
  components: {
    co: number;
    no: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
    nh3: number;
  };
  datetime: string;
}

/**
 * Get the OpenWeather API key with error handling
 */
export const getOpenWeatherApiKey = (): string => {
  return getEnvVariable('VITE_OPENWEATHER_API_KEY');
};

/**
 * Get air quality data by coordinates
 */
export const getAirQualityByCoords = async (coordinates: Coordinates): Promise<AirQualityData> => {
  const apiKey = getOpenWeatherApiKey();
  
  try {
    const airQualityData = await apiRequest<any>(
      'https://api.openweathermap.org/data/2.5/air_pollution',
      {
        params: {
          lat: coordinates.lat,
          lon: coordinates.lon,
          appid: apiKey
        }
      }
    );
    
    if (!airQualityData || !airQualityData.list || airQualityData.list.length === 0) {
      throw new Error('Invalid air quality data received from API');
    }
    
    const data = airQualityData.list[0];
    
    // Get location name using reverse geocoding
    let locationName = 'Current Location';
    try {
      const locationData = await getLocationByCoords(coordinates);
      if (locationData) {
        locationName = locationData;
      }
    } catch (error) {
      console.error('Error fetching location name:', error);
      // We don't throw here since this is not critical
    }
    
    return {
      aqi: data.main.aqi,
      components: {
        co: data.components.co,
        no: data.components.no,
        no2: data.components.no2,
        o3: data.components.o3,
        so2: data.components.so2,
        pm2_5: data.components.pm2_5,
        pm10: data.components.pm10,
        nh3: data.components.nh3
      },
      location: locationName,
      datetime: new Date(data.dt * 1000).toLocaleString()
    };
  } catch (error: any) {
    // Enhance error message for common API key issues
    if (error.response && error.response.status === 401) {
      throw new Error(
        'OpenWeatherMap API key invalid or not activated yet. New API keys can take up to 2 hours to activate. ' +
        'Please check your API key or wait for activation.'
      );
    }
    throw error;
  }
};

/**
 * Get location name by coordinates
 */
export const getLocationByCoords = async (coordinates: Coordinates): Promise<string> => {
  const apiKey = getOpenWeatherApiKey();
  
  if (!apiKey) {
    throw new Error('OpenWeather API key is missing. Please check your environment variables.');
  }
  
  const response = await apiRequest<any>(
    'https://api.openweathermap.org/geo/1.0/reverse',
    {
      params: {
        lat: coordinates.lat,
        lon: coordinates.lon,
        limit: 1,
        appid: apiKey
      }
    }
  );
  
  if (response && response.length > 0) {
    const place = response[0];
    return place.name;
  }
  
  return 'Unknown Location';
};

/**
 * Search location by name and get coordinates
 */
export const searchLocation = async (query: string): Promise<Coordinates> => {
  const apiKey = getOpenWeatherApiKey();
  
  if (!apiKey) {
    throw new Error('OpenWeather API key is missing. Please check your environment variables.');
  }
  
  const response = await apiRequest<any>(
    'https://api.openweathermap.org/geo/1.0/direct',
    {
      params: {
        q: query,
        limit: 1,
        appid: apiKey
      }
    }
  );
  
  if (!response || response.length === 0) {
    throw new Error(`Location "${query}" not found. Please check the spelling and try again.`);
  }
  
  const place = response[0];
  return {
    lat: place.lat,
    lon: place.lon
  };
}; 