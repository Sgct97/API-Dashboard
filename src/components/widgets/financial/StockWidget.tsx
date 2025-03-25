import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  StockData, 
  StockSearchResult,
  getStockData,
  searchStocks
} from '../../../services/financialService';

const StockWidget = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>('IBM');
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(300000); // 5 minutes

  // Fetch stock data
  const fetchStockData = async (symbol: string) => {
    if (!symbol) {
      setError('No stock symbol provided');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getStockData(symbol);
      setStockData(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching stock data');
      }
      
      console.error('Stock data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Search for stocks
  const handleSearchStocks = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchStocks(searchTerm);
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('No matching stocks found. Please try a different search term.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while searching for stocks');
      }
      
      console.error('Stock search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data for selected stock on mount and when selected stock changes
  useEffect(() => {
    fetchStockData(selectedStock);
    
    // Set up refresh interval
    const intervalId = setInterval(() => {
      fetchStockData(selectedStock);
    }, refreshInterval);
    
    // Clean up interval on unmount or when selected stock/interval changes
    return () => clearInterval(intervalId);
  }, [selectedStock, refreshInterval]);

  // Handle stock selection
  const handleSelectStock = (symbol: string) => {
    setSelectedStock(symbol);
    setSearchResults([]);
    setSearchTerm('');
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchStocks();
  };

  // Handle refresh interval change
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRefreshInterval(parseInt(e.target.value));
  };

  // Get stock summary data
  const getStockSummary = () => {
    if (stockData.length === 0) return null;
    
    const firstPrice = stockData[0]?.close || 0;
    const latestPrice = stockData[stockData.length - 1]?.close || 0;
    const changePercent = ((latestPrice - firstPrice) / firstPrice) * 100;
    
    let changeColor = 'text-gray-800 dark:text-gray-200';
    if (changePercent > 0) changeColor = 'text-green-500';
    if (changePercent < 0) changeColor = 'text-red-500';
    
    return {
      firstPrice: firstPrice.toFixed(2),
      latestPrice: latestPrice.toFixed(2),
      changePercent: changePercent.toFixed(2),
      changeColor
    };
  };

  const summary = getStockSummary();

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <form onSubmit={handleSearchSubmit} className="flex mb-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search stocks..."
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
        
        {searchResults.length > 0 && (
          <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <ul className="max-h-40 overflow-y-auto">
              {searchResults.map((result) => (
                <li key={result.symbol} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <button
                    onClick={() => handleSelectStock(result.symbol)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="font-semibold">{result.symbol}</span> - {result.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">{selectedStock}</h4>
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
      </div>
      
      {/* Error message display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Stock chart */}
      {!isLoading && !error && stockData.length > 0 && (
        <div className="flex-grow">
          <div className="h-64 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stockData}
                margin={{
                  top: 5,
                  right: 5,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickCount={5}
                  tickFormatter={(tick) => {
                    const date = new Date(tick);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                  tickFormatter={(tick) => `$${tick}`}
                />
                <Tooltip
                  formatter={(value) => [`$${value}`, 'Price']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {summary && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p>Open</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    ${summary.firstPrice}
                  </p>
                </div>
                <div>
                  <p>Latest</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    ${summary.latestPrice}
                  </p>
                </div>
                <div>
                  <p>Change</p>
                  <p className={`font-medium ${summary.changeColor}`}>
                    {summary.changePercent}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Empty chart state */}
      {!isLoading && !error && stockData.length === 0 && (
        <div className="flex-grow flex justify-center items-center text-gray-500 dark:text-gray-400">
          <p>No stock data available. Please select a different stock.</p>
        </div>
      )}
    </div>
  );
};

export default StockWidget; 