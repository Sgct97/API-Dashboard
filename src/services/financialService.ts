import { apiRequest, getEnvVariable } from './api';

export interface StockData {
  date: string;
  close: number;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
}

/**
 * Get the Alpha Vantage API key with error handling
 */
export const getAlphaVantageApiKey = (): string => {
  return getEnvVariable('VITE_ALPHAVANTAGE_API_KEY');
};

/**
 * Get daily stock data for a given symbol
 */
export const getStockData = async (symbol: string): Promise<StockData[]> => {
  const apiKey = getAlphaVantageApiKey();
  
  if (!apiKey) {
    throw new Error('Alpha Vantage API key is missing. Please check your environment variables.');
  }
  
  const response = await apiRequest<any>(
    `https://www.alphavantage.co/query`,
    {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol,
        apikey: apiKey
      }
    },
    // Cache stock data for longer since it doesn't change as frequently
    30 * 60 * 1000 // 30 minutes
  );
  
  // Handle API errors
  if (response['Error Message']) {
    throw new Error(`API Error: ${response['Error Message']}`);
  }
  
  if (response['Note']) {
    throw new Error(`API Limit Reached: ${response['Note']}`);
  }
  
  if (!response['Time Series (Daily)']) {
    throw new Error('Invalid API response: Time Series data not found');
  }
  
  // Transform the data for the chart
  const timeSeriesData = response['Time Series (Daily)'];
  const formattedData: StockData[] = Object.keys(timeSeriesData)
    .slice(0, 30) // Get last 30 days
    .reverse() // Display oldest to newest
    .map(date => ({
      date: date,
      close: parseFloat(timeSeriesData[date]['4. close'])
    }));
  
  return formattedData;
};

/**
 * Search for stocks by keyword
 */
export const searchStocks = async (query: string): Promise<StockSearchResult[]> => {
  const apiKey = getAlphaVantageApiKey();
  
  if (!apiKey) {
    throw new Error('Alpha Vantage API key is missing. Please check your environment variables.');
  }
  
  if (!query.trim()) {
    return [];
  }
  
  const response = await apiRequest<any>(
    `https://www.alphavantage.co/query`,
    {
      params: {
        function: 'SYMBOL_SEARCH',
        keywords: query,
        apikey: apiKey
      }
    }
  );
  
  // Handle API errors
  if (response['Error Message']) {
    throw new Error(`API Error: ${response['Error Message']}`);
  }
  
  if (response['Note']) {
    throw new Error(`API Limit Reached: ${response['Note']}`);
  }
  
  if (!response.bestMatches) {
    throw new Error('Invalid API response: search results not found');
  }
  
  const results: StockSearchResult[] = response.bestMatches.map((match: any) => ({
    symbol: match['1. symbol'],
    name: match['2. name']
  }));
  
  return results;
}; 