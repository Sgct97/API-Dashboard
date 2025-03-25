import { useState, useEffect } from 'react';
import { 
  AirQualityData, 
  getAirQualityByCoords,
  searchLocation
} from '../../../services/airQualityService';
import { Coordinates } from '../../../services/weatherService';

const AirQualityWidget = () => {
  const [location, setLocation] = useState<string>('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(3600000); // 1 hour

  // Get user's location on initial load
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        position => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setCoordinates(coords);
          fetchAirQuality(coords);
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
          enableHighAccuracy: false  // High accuracy not needed for air quality
        }
      );
    } else {
      setError('Geolocation is not supported by your browser. Please search for a city manually.');
    }
  }, []);
  
  // Set up refresh interval
  useEffect(() => {
    if (coordinates) {
      const intervalId = setInterval(() => {
        fetchAirQuality(coordinates);
      }, refreshInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [coordinates, refreshInterval]);

  // Fetch air quality data
  const fetchAirQuality = async (coords: Coordinates) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getAirQualityByCoords(coords);
      setAirQualityData(data);
      setLocation(data.location);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching air quality data');
      }
      
      console.error('Air quality fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Search for a location
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const coords = await searchLocation(location);
      setCoordinates(coords);
      fetchAirQuality(coords);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while searching for the location');
      }
      
      console.error('Location search error:', err);
      setIsLoading(false);
    }
  };

  // Handle refresh interval change
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRefreshInterval(parseInt(e.target.value));
  };

  // Get AQI description and color
  const getAqiInfo = (aqi: number) => {
    switch (aqi) {
      case 1:
        return { 
          label: 'Good', 
          description: 'Air quality is satisfactory, and air pollution poses little or no risk.',
          color: 'text-green-500 bg-green-100 dark:bg-green-900/30' 
        };
      case 2:
        return { 
          label: 'Fair', 
          description: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.',
          color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' 
        };
      case 3:
        return { 
          label: 'Moderate', 
          description: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
          color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' 
        };
      case 4:
        return { 
          label: 'Poor', 
          description: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.',
          color: 'text-red-500 bg-red-100 dark:bg-red-900/30' 
        };
      case 5:
        return { 
          label: 'Very Poor', 
          description: 'Health alert: The risk of health effects is increased for everyone.',
          color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' 
        };
      default:
        return { 
          label: 'Unknown', 
          description: 'Air quality information is not available.',
          color: 'text-gray-500 bg-gray-100 dark:bg-gray-900/30' 
        };
    }
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
      
      {/* Refresh interval */}
      <div className="flex justify-end items-center mb-4">
        <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Refresh:</span>
        <select
          value={refreshInterval}
          onChange={handleIntervalChange}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-1"
        >
          <option value="900000">15 min</option>
          <option value="1800000">30 min</option>
          <option value="3600000">1 hour</option>
          <option value="10800000">3 hours</option>
        </select>
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
      
      {/* Air quality data display */}
      {!isLoading && !error && airQualityData && (
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm mb-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{airQualityData.location}</h3>
                <p className="text-gray-500 dark:text-gray-400">{airQualityData.datetime}</p>
              </div>
              <div>
                <span className={`inline-block px-3 py-1 rounded-full font-medium ${getAqiInfo(airQualityData.aqi).color}`}>
                  {getAqiInfo(airQualityData.aqi).label}
                </span>
              </div>
            </div>
            
            <p className="mb-4 text-sm">{getAqiInfo(airQualityData.aqi).description}</p>
            
            <h4 className="font-semibold mb-2">Pollutants</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">PM2.5</p>
                <p className="font-semibold">{airQualityData.components.pm2_5} μg/m³</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">PM10</p>
                <p className="font-semibold">{airQualityData.components.pm10} μg/m³</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">Ozone (O₃)</p>
                <p className="font-semibold">{airQualityData.components.o3} μg/m³</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">Nitrogen Dioxide (NO₂)</p>
                <p className="font-semibold">{airQualityData.components.no2} μg/m³</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">Sulfur Dioxide (SO₂)</p>
                <p className="font-semibold">{airQualityData.components.so2} μg/m³</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">Carbon Monoxide (CO)</p>
                <p className="font-semibold">{airQualityData.components.co} μg/m³</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && !error && !airQualityData && (
        <div className="flex justify-center items-center py-8 text-gray-500 dark:text-gray-400">
          <p>Enter a city name to view air quality information.</p>
        </div>
      )}
    </div>
  );
};

export default AirQualityWidget; 