import { apiRequest, getEnvVariable } from './api';

export interface WeatherData {
  location: string;
  country: string;
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  sunrise: number;
  sunset: number;
  forecast: ForecastData[];
}

export interface ForecastData {
  date: string;
  time: string;
  temp: number;
  feelsLike: number;
  icon: string;
  description: string;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

/**
 * Get the OpenWeather API key with error handling
 */
export const getOpenWeatherApiKey = (): string => {
  const apiKey = getEnvVariable('VITE_OPENWEATHER_API_KEY');
  
  if (apiKey === 'b6907d289e10d714a6e88b30761fae22') {
    throw new Error(
      'You are using the sample OpenWeatherMap API key from their documentation. ' +
      'This key will not work for actual API calls. ' +
      'Please sign up for a free API key at https://home.openweathermap.org/users/sign_up'
    );
  }
  
  return apiKey;
};

/**
 * Get current weather by city name
 */
export const getWeatherByCity = async (city: string, unit: 'metric' | 'imperial' = 'metric'): Promise<WeatherData> => {
  const apiKey = getOpenWeatherApiKey();
  
  try {
    // Get current weather
    const currentWeather = await apiRequest<any>(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          q: city,
          units: unit,
          appid: apiKey
        }
      }
    );
    
    // Get forecast
    const forecast = await apiRequest<any>(
      'https://api.openweathermap.org/data/2.5/forecast',
      {
        params: {
          q: city,
          units: unit,
          appid: apiKey
        }
      }
    );
    
    return formatWeatherData(currentWeather, forecast);
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
 * Get current weather by coordinates
 */
export const getWeatherByCoords = async (coordinates: Coordinates, unit: 'metric' | 'imperial' = 'metric'): Promise<WeatherData> => {
  const apiKey = getOpenWeatherApiKey();
  
  if (!apiKey) {
    throw new Error('OpenWeather API key is missing. Please check your environment variables.');
  }
  
  try {
    // Get current weather
    const currentWeather = await apiRequest<any>(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          lat: coordinates.lat,
          lon: coordinates.lon,
          units: unit,
          appid: apiKey
        }
      }
    );
    
    // Get forecast
    const forecast = await apiRequest<any>(
      'https://api.openweathermap.org/data/2.5/forecast',
      {
        params: {
          lat: coordinates.lat,
          lon: coordinates.lon,
          units: unit,
          appid: apiKey
        }
      }
    );
    
    return formatWeatherData(currentWeather, forecast);
  } catch (error) {
    throw error;
  }
};

/**
 * Format the weather data consistently
 */
const formatWeatherData = (currentWeather: any, forecast: any): WeatherData => {
  const forecastData: ForecastData[] = forecast.list.slice(0, 8).map((item: any) => {
    const date = new Date(item.dt * 1000);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: item.main.temp,
      feelsLike: item.main.feels_like,
      icon: item.weather[0].icon,
      description: item.weather[0].description
    };
  });
  
  return {
    location: currentWeather.name,
    country: currentWeather.sys.country,
    temperature: currentWeather.main.temp,
    feelsLike: currentWeather.main.feels_like,
    description: currentWeather.weather[0].description,
    icon: currentWeather.weather[0].icon,
    humidity: currentWeather.main.humidity,
    windSpeed: currentWeather.wind.speed,
    pressure: currentWeather.main.pressure,
    sunrise: currentWeather.sys.sunrise,
    sunset: currentWeather.sys.sunset,
    forecast: forecastData
  };
}; 