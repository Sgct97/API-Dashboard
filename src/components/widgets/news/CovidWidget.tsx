import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CovidData {
  country: string;
  cases: number;
  todayCases: number;
  deaths: number;
  todayDeaths: number;
  recovered: number;
  todayRecovered: number;
  active: number;
  critical: number;
  tests: number;
  population: number;
  updated: number;
}

interface HistoricalData {
  date: string;
  cases: number;
  deaths: number;
  recovered?: number;
}

const CovidWidget = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('worldwide');
  const [covidData, setCovidData] = useState<CovidData | null>(null);
  const [historyData, setHistoryData] = useState<HistoricalData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(3600000); // 1 hour
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Fetch list of countries on initial load
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch data for selected country and set up refresh interval
  useEffect(() => {
    if (selectedCountry) {
      fetchCovidData();
      fetchHistoricalData();
      
      const intervalId = setInterval(() => {
        fetchCovidData();
        fetchHistoricalData();
      }, refreshInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [selectedCountry, refreshInterval]);

  // Update filtered countries list when search term changes
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredCountries([]);
    } else {
      const filtered = countries.filter(
        country => country.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCountries(filtered.slice(0, 5)); // Limit to 5 results for UX
    }
  }, [searchTerm, countries]);

  // Fetch list of available countries
  const fetchCountries = async () => {
    try {
      const response = await axios.get('https://disease.sh/v3/covid-19/countries');
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid data received from API');
      }
      
      const countryNames = response.data.map((country: any) => country.country);
      setCountries(countryNames);
    } catch (err) {
      console.error('Error fetching countries:', err);
      // We don't set the error state here since this is not critical for the widget
    }
  };

  // Fetch current COVID-19 data
  const fetchCovidData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = 'https://disease.sh/v3/covid-19/all';
      
      if (selectedCountry !== 'worldwide') {
        url = `https://disease.sh/v3/covid-19/countries/${selectedCountry}`;
      }
      
      const response = await axios.get(url);
      
      if (!response.data) {
        throw new Error('Invalid data received from API');
      }
      
      setCovidData(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          if (err.response.status === 404) {
            setError(`Country "${selectedCountry}" not found. Please select another country.`);
          } else {
            setError(`API Error: ${err.response.status} - ${err.response.statusText}`);
          }
        } else if (err.request) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(`Error: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching COVID-19 data');
      }
      
      console.error('COVID data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch historical data for charts
  const fetchHistoricalData = async () => {
    try {
      let url = 'https://disease.sh/v3/covid-19/historical/all?lastdays=30';
      
      if (selectedCountry !== 'worldwide') {
        url = `https://disease.sh/v3/covid-19/historical/${selectedCountry}?lastdays=30`;
      }
      
      const response = await axios.get(url);
      
      if (!response.data) {
        return; // No need to throw, just return as this is supplementary data
      }
      
      // Handle different response formats for worldwide vs country
      const timeline = selectedCountry === 'worldwide' 
        ? response.data 
        : response.data.timeline;
      
      if (!timeline || !timeline.cases) {
        return;
      }
      
      // Transform the data for the chart
      const formattedData: HistoricalData[] = Object.keys(timeline.cases).map(date => ({
        date,
        cases: timeline.cases[date],
        deaths: timeline.deaths[date],
        recovered: timeline.recovered ? timeline.recovered[date] : 0
      }));
      
      setHistoryData(formattedData);
    } catch (err) {
      console.error('Historical data fetch error:', err);
      // We don't set the error state here as this is supplementary data
    }
  };

  // Handle country selection
  const handleSelectCountry = (country: string) => {
    setSelectedCountry(country);
    setSearchTerm('');
    setShowDropdown(false);
    setFilteredCountries([]);
  };

  // Handle refresh interval change
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRefreshInterval(parseInt(e.target.value));
  };

  // Format large numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get percentage from total cases
  const getPercentage = (value: number, total: number) => {
    if (!total) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  // Calculate display metrics
  const getMetrics = () => {
    if (!covidData) return null;
    
    return {
      activeCases: formatNumber(covidData.active),
      totalCases: formatNumber(covidData.cases),
      newCases: formatNumber(covidData.todayCases),
      totalDeaths: formatNumber(covidData.deaths),
      newDeaths: formatNumber(covidData.todayDeaths),
      totalRecovered: formatNumber(covidData.recovered),
      newRecovered: formatNumber(covidData.todayRecovered),
      critical: formatNumber(covidData.critical),
      tests: formatNumber(covidData.tests),
      population: formatNumber(covidData.population),
      deathRate: getPercentage(covidData.deaths, covidData.cases),
      recoveryRate: getPercentage(covidData.recovered, covidData.cases),
      activeRate: getPercentage(covidData.active, covidData.cases),
      testRate: getPercentage(covidData.tests, covidData.population),
      updated: formatDate(covidData.updated)
    };
  };

  const metrics = getMetrics();
  
  // Helper function to check if we should show the recovered bar
  const shouldShowRecoveredBar = () => {
    if (historyData.length === 0) return false;
    const firstItem = historyData[0];
    return firstItem && typeof firstItem.recovered === 'number' && firstItem.recovered > 0;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="relative mb-3">
          <div className="flex">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search country..."
              className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleSelectCountry('worldwide')}
              className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              Worldwide
            </button>
          </div>
          
          {showDropdown && filteredCountries.length > 0 && (
            <div className="absolute z-10 w-full mt-1 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-lg">
              <ul className="max-h-40 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <li key={country} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <button
                      onClick={() => handleSelectCountry(country)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {country}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-lg">
            {selectedCountry === 'worldwide' ? 'Global Statistics' : selectedCountry}
          </h3>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Refresh:</span>
            <select
              value={refreshInterval}
              onChange={handleIntervalChange}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-1"
            >
              <option value="1800000">30 min</option>
              <option value="3600000">1 hour</option>
              <option value="7200000">2 hours</option>
              <option value="14400000">4 hours</option>
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
      
      {/* COVID-19 Data */}
      {!isLoading && !error && metrics && (
        <div className="overflow-y-auto">
          {/* Last updated */}
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Last updated: {metrics.updated}
          </p>
          
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Confirmed Cases</div>
              <div className="font-bold text-lg">{metrics.totalCases}</div>
              <div className="text-xs text-green-600 dark:text-green-400">+{metrics.newCases} today</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Deaths</div>
              <div className="font-bold text-lg">{metrics.totalDeaths}</div>
              <div className="text-xs text-red-600 dark:text-red-400">+{metrics.newDeaths} today</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Recovered</div>
              <div className="font-bold text-lg">{metrics.totalRecovered}</div>
              <div className="text-xs text-green-600 dark:text-green-400">+{metrics.newRecovered} today</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
              <div className="font-bold text-lg">{metrics.activeCases}</div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">{metrics.activeRate} of total</div>
            </div>
          </div>
          
          {/* Additional stats */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Critical Cases:</span>
                <span className="ml-1 font-semibold">{metrics.critical}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Tests:</span>
                <span className="ml-1 font-semibold">{metrics.tests}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Population:</span>
                <span className="ml-1 font-semibold">{metrics.population}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Test Rate:</span>
                <span className="ml-1 font-semibold">{metrics.testRate}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Death Rate:</span>
                <span className="ml-1 font-semibold">{metrics.deathRate}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Recovery Rate:</span>
                <span className="ml-1 font-semibold">{metrics.recoveryRate}</span>
              </div>
            </div>
          </div>
          
          {/* Historical chart */}
          {historyData.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">30-Day Trend</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={historyData.filter((_, i) => i % 3 === 0)} // Show every 3rd day to avoid crowding
                    margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(tick) => {
                        const date = new Date(tick);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                      height={50}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(tick) => {
                        if (tick >= 1000000) return `${(tick / 1000000).toFixed(1)}M`;
                        if (tick >= 1000) return `${(tick / 1000).toFixed(0)}K`;
                        return tick;
                      }}
                    />
                    <Tooltip 
                      formatter={(value: any) => [new Intl.NumberFormat().format(value), '']}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString();
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, marginTop: 0 }}/>
                    <Bar 
                      dataKey="cases" 
                      name="Cases" 
                      fill="#3b82f6" 
                      stackId="a"
                    />
                    <Bar 
                      dataKey="deaths" 
                      name="Deaths" 
                      fill="#ef4444"
                      stackId="a" 
                    />
                    {shouldShowRecoveredBar() && (
                      <Bar 
                        dataKey="recovered" 
                        name="Recovered" 
                        fill="#10b981"
                        stackId="a" 
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && !error && !metrics && (
        <div className="flex justify-center items-center py-8 text-gray-500 dark:text-gray-400">
          <p>No COVID-19 data available. Please try another country.</p>
        </div>
      )}
    </div>
  );
};

export default CovidWidget; 