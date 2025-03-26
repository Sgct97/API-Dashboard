import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Cache duration in milliseconds
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheItem {
  data: any;
  timestamp: number;
}

const cache: Record<string, CacheItem> = {};

/**
 * Generate a cache key from the request URL and params
 */
const getCacheKey = (url: string, params?: Record<string, any>): string => {
  return `${url}${params ? JSON.stringify(params) : ''}`;
};

/**
 * Check if a cached item is still valid
 */
const isCacheValid = (cacheKey: string, cacheDuration: number): boolean => {
  const item = cache[cacheKey];
  if (!item) return false;
  
  const now = Date.now();
  return now - item.timestamp < cacheDuration;
};

/**
 * Make an API request with caching
 */
export const apiRequest = async <T>(
  url: string, 
  options: AxiosRequestConfig = {}, 
  cacheDuration: number = DEFAULT_CACHE_DURATION
): Promise<T> => {
  const cacheKey = getCacheKey(url, options.params);
  
  console.log(`API Request to: ${url}`);
  console.log('Request params:', options.params);
  
  // Return cached data if valid
  if (isCacheValid(cacheKey, cacheDuration)) {
    console.log('Using cached data for:', url);
    return cache[cacheKey]?.data as T;
  }
  
  try {
    console.log('Making fresh request to:', url);
    const response: AxiosResponse<T> = await axios({ url, ...options });
    
    console.log('Response status:', response.status);
    
    // Cache the response
    cache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
  } catch (error) {
    console.log('Request failed for:', url);
    handleApiError(error as AxiosError, url);
    throw error;
  }
};

/**
 * Handle API errors consistently
 */
export const handleApiError = (error: AxiosError, url?: string): void => {
  if (error.response) {
    // The request was made and the server responded with a status code
    console.error('API Error Response:', {
      url: url || error.config?.url,
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    });
    
    // Special handling for OpenWeatherMap API errors
    if (url?.includes('openweathermap.org')) {
      console.error('OpenWeatherMap API Error:', error.response.data);
      
      // Add specific error messages for OpenWeatherMap error codes
      if (error.response.status === 401) {
        console.error('⚠️ OpenWeatherMap API key is invalid or has not been activated yet.');
        console.error('⚠️ Note that it can take up to 2 hours for a new API key to become active.');
      } else if (error.response.status === 404) {
        console.error('⚠️ City or location not found.');
      } else if (error.response.status === 429) {
        console.error('⚠️ API rate limit exceeded. Free accounts are limited to 60 calls per minute.');
      }
    }
    
    // Handle rate limiting errors specifically
    if (error.response.status === 429) {
      console.error('API Rate limit exceeded. Consider implementing backoff strategy or reducing request frequency.');
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API No Response Error:', {
      url: url || error.config?.url,
      request: error.request
    });
    console.error('⚠️ This could indicate a network issue, CORS problem, or service downtime.');
  } else {
    // Something happened in setting up the request
    console.error('API Request Setup Error:', error.message);
  }
};

/**
 * Clear the entire cache
 */
export const clearCache = (): void => {
  Object.keys(cache).forEach(key => {
    delete cache[key];
  });
};

/**
 * Clear a specific item from the cache
 */
export const clearCacheItem = (url: string, params?: Record<string, any>): void => {
  const cacheKey = getCacheKey(url, params);
  delete cache[cacheKey];
};

/**
 * Get environment variable with consistent error handling
 */
export const getEnvVariable = (key: string): string => {
  console.log(`Accessing environment variable: ${key}`);
  const value = import.meta.env[key];
  
  if (!value) {
    console.error(`Environment variable ${key} is not set or is empty`);
    console.log('Available env vars:', Object.keys(import.meta.env).join(', '));
    return '';
  }
  
  console.log(`Found ${key} with length: ${value.length}`);
  return value;
}; 