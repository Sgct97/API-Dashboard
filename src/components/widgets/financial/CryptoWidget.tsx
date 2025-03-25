import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CryptoData {
  date: string;
  price: number;
}

interface CryptoCurrency {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

const CryptoWidget = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cryptoList, setCryptoList] = useState<CryptoCurrency[]>([]);
  const [filteredCryptos, setFilteredCryptos] = useState<CryptoCurrency[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('bitcoin');
  const [selectedName, setSelectedName] = useState<string>('Bitcoin');
  const [priceData, setPriceData] = useState<CryptoData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(300000); // 5 minutes

  // Fetch list of top cryptocurrencies
  const fetchCryptoList = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 50,
            page: 1,
            sparkline: false
          }
        }
      );
      
      setCryptoList(response.data);
      
      // If this is the first load and we have bitcoin, update the name
      if (selectedCrypto === 'bitcoin' && response.data.length > 0) {
        const bitcoin = response.data.find(crypto => crypto.id === 'bitcoin');
        if (bitcoin) {
          setSelectedName(bitcoin.name);
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(`API Error: ${err.response.status} - ${err.response.statusText}`);
        } else if (err.request) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(`Error: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching cryptocurrency list');
      }
      
      // Log detailed error info for debugging
      console.error('Crypto list fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch historical price data for selected cryptocurrency
  const fetchCryptoData = async (cryptoId: string) => {
    setIsChartLoading(true);
    setChartError(null);
    
    try {
      // First try the CoinGecko API
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days: 14,
            interval: 'daily'
          }
        }
      );
      
      if (!response.data.prices || !Array.isArray(response.data.prices)) {
        throw new Error('Invalid data received from API');
      }
      
      // Transform the data for the chart
      const formattedData: CryptoData[] = response.data.prices.map(
        (item: [number, number]) => ({
          date: new Date(item[0]).toISOString().split('T')[0],
          price: Number(item[1]) // Ensure this is a proper number
        })
      );
      
      // Sort data by date ascending (oldest to newest)
      formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log("Chart data loaded successfully:", formattedData.length, "data points");
      setPriceData(formattedData);
    } catch (err) {
      console.error('Error fetching crypto data:', err);
      
      let errorMessage = 'Failed to load chart data';
      
      if (axios.isAxiosError(err)) {
        if (err.response) {
          // Check for rate limiting headers
          if (err.response.status === 429) {
            errorMessage = 'API rate limit exceeded. Please try again later.';
          } else {
            errorMessage = `API Error: ${err.response.status} - ${err.response.statusText}`;
          }
        } else if (err.request) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setChartError(errorMessage);
      
      // Generate fallback demo data if API fails
      // This prevents the chart from disappearing completely
      const demoData: CryptoData[] = [];
      const today = new Date();
      const cryptoInfo = cryptoList.find(c => c.id === cryptoId);
      const basePrice = cryptoInfo?.current_price || 2000;
      
      for (let i = 14; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Create slightly varied prices around the base price
        const variance = (Math.sin(i * 0.5) * 0.05) + ((Math.random() - 0.5) * 0.02);
        const price = basePrice * (1 + variance);
        
        demoData.push({
          date: dateStr,
          price: Number(price) // Ensure price is a proper number, not a string
        });
      }
      
      // Only use demo data if we have no real data
      if (priceData.length === 0) {
        console.log("Using fallback demo data for chart");
        setPriceData(demoData);
      }
    } finally {
      setIsChartLoading(false);
    }
  };

  // Initial fetch of crypto list
  useEffect(() => {
    fetchCryptoList();
  }, []);

  // Fetch data for selected crypto and set up refresh interval
  useEffect(() => {
    if (selectedCrypto) {
      fetchCryptoData(selectedCrypto);
      
      const intervalId = setInterval(() => {
        fetchCryptoData(selectedCrypto);
      }, refreshInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [selectedCrypto, refreshInterval]);

  // Filter cryptos based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCryptos([]);
    } else {
      const filtered = cryptoList.filter(
        crypto => 
          crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCryptos(filtered);
    }
  }, [searchTerm, cryptoList]);

  // Handle crypto selection
  const handleSelectCrypto = (cryptoId: string, cryptoName: string) => {
    setSelectedCrypto(cryptoId);
    setSelectedName(cryptoName || 'Cryptocurrency');
    setSearchTerm('');
    setFilteredCryptos([]);
  };

  // Handle refresh interval change
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRefreshInterval(parseInt(e.target.value));
  };

  // Get current price and 24h change
  const getCurrentCrypto = () => {
    return cryptoList.find(crypto => crypto.id === selectedCrypto);
  };

  const currentCrypto = getCurrentCrypto();

  // Format price for display with appropriate decimal places
  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 10) return price.toFixed(3);
    if (price < 1000) return price.toFixed(2);
    return price.toFixed(2);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="relative mb-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cryptocurrencies..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {filteredCryptos.length > 0 && (
            <div className="absolute z-10 w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-lg">
              <ul className="max-h-40 overflow-y-auto">
                {filteredCryptos.map((crypto) => (
                  <li key={crypto.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <button
                      onClick={() => handleSelectCrypto(crypto.id, crypto.name)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
                    >
                      <img src={crypto.image} alt={crypto.name} className="w-5 h-5 mr-2" />
                      <span className="font-semibold">{crypto.name}</span>
                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                        ({crypto.symbol.toUpperCase()})
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            {currentCrypto && (
              <>
                <img src={currentCrypto.image} alt={currentCrypto.name} className="w-6 h-6 mr-2" />
                <h4 className="font-semibold">{currentCrypto.name}</h4>
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  ({currentCrypto.symbol.toUpperCase()})
                </span>
              </>
            )}
            {!currentCrypto && (
              <h4 className="font-semibold">{selectedName}</h4>
            )}
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
        
        {currentCrypto && (
          <div className="flex justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-md mb-3">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Price:</span>
              <span className="ml-1 font-semibold">${formatPrice(currentCrypto.current_price)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">24h Change:</span>
              <span className={`ml-1 font-semibold ${
                currentCrypto.price_change_percentage_24h >= 0 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {currentCrypto.price_change_percentage_24h >= 0 ? '+' : ''}
                {currentCrypto.price_change_percentage_24h.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Main Error message display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {/* Chart Error message (less prominent) */}
      {!error && chartError && (
        <div className="mb-4 p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-sm rounded-md border border-amber-200 dark:border-amber-800/30">
          <p>{chartError}</p>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Chart */}
      {!isLoading && priceData.length > 0 && (
        <div className="flex-grow" style={{ minHeight: "200px" }}>
          {isChartLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 z-10">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <LineChart data={priceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickFormatter={(tick) => {
                  const date = new Date(tick);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                domain={['dataMin - dataMin * 0.05', 'dataMax + dataMax * 0.05']}
                tickFormatter={(tick) => {
                  // Format the tick value properly based on magnitude
                  if (tick === 0) return '$0';
                  if (tick < 1) return `$${tick.toFixed(3)}`;
                  if (tick < 10) return `$${tick.toFixed(2)}`;
                  if (tick < 1000) return `$${tick.toFixed(0)}`;
                  return `$${(tick/1000).toFixed(1)}K`;
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  border: 'none', 
                  borderRadius: '4px', 
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)' 
                }}
                formatter={(value: any) => {
                  if (typeof value === 'number') {
                    return [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Price'];
                  }
                  return [value, 'Price'];
                }}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString();
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && !error && priceData.length === 0 && (
        <div className="flex justify-center items-center py-8 text-gray-500 dark:text-gray-400">
          <p>No cryptocurrency data available.</p>
        </div>
      )}
    </div>
  );
};

export default CryptoWidget; 