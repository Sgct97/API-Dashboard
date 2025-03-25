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
  
  // Return cached data if valid
  if (isCacheValid(cacheKey, cacheDuration)) {
    return cache[cacheKey]?.data as T;
  }
  
  try {
    const response: AxiosResponse<T> = await axios({ url, ...options });
    
    // Cache the response
    cache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

/**
 * Handle API errors consistently
 */
export const handleApiError = (error: AxiosError): void => {
  if (error.response) {
    // The request was made and the server responded with a status code
    console.error('API Error Response:', {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    });
    
    // Handle rate limiting errors specifically
    if (error.response.status === 429) {
      console.error('API Rate limit exceeded. Consider implementing backoff strategy or reducing request frequency.');
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API No Response Error:', error.request);
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
  const value = import.meta.env[key];
  
  if (!value) {
    console.error(`Environment variable ${key} is not set`);
    return '';
  }
  
  return value;
}; 