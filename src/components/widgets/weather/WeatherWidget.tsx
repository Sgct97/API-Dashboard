import { useState, useEffect } from 'react';
import { 
  WeatherData, 
  Coordinates, 
  getWeatherByCity, 
  getWeatherByCoords 
} from '../../../services/weatherService';

const WeatherWidget = () => {
  const [location, setLocation] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(600000); // 10 minutes
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

  // Get user's location on initial load
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        position => {
          fetchWeatherByCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        err => {
          console.error('Geolocation error:', err);
          setError('Unable to get your location. Please search for a city manually.');
          setIsLoading(false);
        },
        // Add options to improve geolocation experience
        { 
          timeout: 10000,           // 10 second timeout
          maximumAge: 60 * 60 * 1000, // Cache the position for 1 hour
          enableHighAccuracy: false  // High accuracy not needed for weather
        }
      );
    } else {
      setError('Geolocation is not supported by your browser. Please search for a city manually.');
    }
  }, []);
  
  // Set up refresh interval
  useEffect(() => {
    if (weatherData) {
      const intervalId = setInterval(() => {
        if (location) {
          fetchWeather(location);
        } else if (weatherData) {
          fetchWeather(weatherData.location);
        }
      }, refreshInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [weatherData, refreshInterval, location, unit]);

  // Fetch weather data by city name
  const fetchWeather = async (city: string) => {
    if (!city.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getWeatherByCity(city, unit);
      setWeatherData(data);
      setLocation(city);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching weather data');
      }
      
      console.error('Weather fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch weather data by coordinates
  const fetchWeatherByCoords = async (coords: Coordinates) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getWeatherByCoords(coords, unit);
      setWeatherData(data);
      setLocation(data.location);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching weather data');
      }
      
      console.error('Weather fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle location search form submission
  const handleLocationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeather(location);
  };

  // Handle refresh interval change
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRefreshInterval(parseInt(e.target.value));
  };
  
  // Handle unit change
  const handleUnitChange = () => {
    const newUnit = unit === 'metric' ? 'imperial' : 'metric';
    setUnit(newUnit);
    
    // Refresh data with new unit
    if (weatherData) {
      if (location) {
        fetchWeather(location);
      } else {
        fetchWeather(weatherData.location);
      }
    }
  };
  
  // Format temperature with unit
  const formatTemp = (temp: number) => {
    return `${Math.round(temp)}°${unit === 'metric' ? 'C' : 'F'}`;
  };
  
  // Format timestamp to time
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search form */}
      <form onSubmit={handleLocationSearch} className="flex mb-4">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter city name..."
          className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-700"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Search'}
        </button>
      </form>
      
      {/* Options bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Units:</span>
          <button
            onClick={handleUnitChange}
            className="px-2 py-1 text-xs font-medium rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {unit === 'metric' ? 'Celsius °C' : 'Fahrenheit °F'}
          </button>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Refresh:</span>
          <select
            value={refreshInterval}
            onChange={handleIntervalChange}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-1"
          >
            <option value="60000">1 min</option>
            <option value="300000">5 min</option>
            <option value="600000">10 min</option>
            <option value="3600000">1 hour</option>
          </select>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Weather data display */}
      {!isLoading && !error && weatherData && (
        <div>
          {/* Current weather */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm mb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-semibold">{weatherData.location}, {weatherData.country}</h3>
                <p className="text-gray-500 dark:text-gray-400 capitalize">{weatherData.description}</p>
              </div>
              <img 
                src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`} 
                alt={weatherData.description} 
                className="w-16 h-16"
              />
            </div>
            
            <div className="flex flex-wrap -mx-2">
              <div className="px-2 w-1/2 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  <p className="text-3xl font-bold">{formatTemp(weatherData.temperature)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Feels like {formatTemp(weatherData.feelsLike)}</p>
                </div>
              </div>
              
              <div className="px-2 w-1/2 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded h-full flex flex-col justify-center">
                  <div className="flex items-center mb-1">
                    <span className="w-24 text-sm text-gray-500 dark:text-gray-400">Humidity:</span>
                    <span>{weatherData.humidity}%</span>
                  </div>
                  <div className="flex items-center mb-1">
                    <span className="w-24 text-sm text-gray-500 dark:text-gray-400">Wind:</span>
                    <span>{weatherData.windSpeed} {unit === 'metric' ? 'm/s' : 'mph'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 text-sm text-gray-500 dark:text-gray-400">Pressure:</span>
                    <span>{weatherData.pressure} hPa</span>
                  </div>
                </div>
              </div>
              
              <div className="px-2 w-full mb-2">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div>
                    <p>Sunrise</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{formatTime(weatherData.sunrise)}</p>
                  </div>
                  <div className="text-right">
                    <p>Sunset</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{formatTime(weatherData.sunset)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Forecast */}
          <h4 className="font-semibold mb-2">Forecast</h4>
          <div className="overflow-x-auto">
            <div className="flex space-x-3 pb-2">
              {weatherData.forecast.map((item, index) => (
                <div key={index} className="min-w-[100px] bg-gray-50 dark:bg-gray-800 rounded p-2 text-center border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.time}</p>
                  <img 
                    src={`https://openweathermap.org/img/wn/${item.icon}.png`} 
                    alt={item.description}
                    className="w-10 h-10 mx-auto"
                  />
                  <p className="font-semibold">{formatTemp(item.temp)}</p>
                  <p className="text-xs capitalize truncate">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && !error && !weatherData && (
        <div className="flex justify-center items-center py-8 text-gray-500 dark:text-gray-400">
          <p>Enter a city name to view weather information.</p>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget; 