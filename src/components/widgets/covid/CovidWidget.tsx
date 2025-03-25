import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

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

// Countries to show in dropdown by default before search
const POPULAR_COUNTRIES = [
  'USA', 'India', 'France', 'Germany', 'Brazil', 'Japan', 'South Korea', 
  'Italy', 'UK', 'Russia', 'Turkey', 'Spain', 'Vietnam', 'Australia'
];

const CovidWidget = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('worldwide');
  const [covidData, setCovidData] = useState<CovidData | null>(null);
  const [historyData, setHistoryData] = useState<HistoricalData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval] = useState<number>(3600000); // 1 hour
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  
  // Fetch all countries on first load
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('https://disease.sh/v3/covid-19/countries');
        const countryNames = response.data.map((country: any) => country.country);
        setCountries(countryNames);
      } catch (err) {
        console.error('Error fetching countries:', err);
        setCountries(POPULAR_COUNTRIES);
      }
    };
    
    fetchCountries();
    fetchCovidData(); // Initial data load
  }, []);
  
  // Update filtered countries when search term changes
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
  
  // Fetch COVID-19 data from API
  const fetchCovidData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (selectedCountry === 'worldwide') {
        response = await axios.get('https://disease.sh/v3/covid-19/all');
        setCovidData({
          country: 'Global',
          ...response.data
        });
      } else {
        response = await axios.get(`https://disease.sh/v3/covid-19/countries/${selectedCountry}`);
        setCovidData(response.data);
      }
      
      // Fetch historical data
      await fetchHistoricalData(selectedCountry);
    } catch (err) {
      console.error('Error fetching COVID data:', err);
      setError('An error occurred while fetching COVID-19 data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch historical data for charts
  const fetchHistoricalData = async (country: string) => {
    try {
      let response;
      
      if (country === 'worldwide') {
        response = await axios.get('https://disease.sh/v3/covid-19/historical/all?lastdays=30');
        
        // Transform the data for the chart
        const { cases, deaths, recovered } = response.data;
        const formattedData: HistoricalData[] = [];
        
        // Convert API response format to our chart format
        for (const date in cases) {
          formattedData.push({
            date: date,
            cases: cases[date],
            deaths: deaths[date],
            recovered: recovered ? recovered[date] : undefined
          });
        }
        
        setHistoryData(formattedData);
      } else {
        response = await axios.get(`https://disease.sh/v3/covid-19/historical/${country}?lastdays=30`);
        
        // Transform the data for the chart
        const { cases, deaths, recovered } = response.data.timeline;
        const formattedData: HistoricalData[] = [];
        
        // Convert API response format to our chart format
        for (const date in cases) {
          formattedData.push({
            date: date,
            cases: cases[date],
            deaths: deaths[date],
            recovered: recovered ? recovered[date] : undefined
          });
        }
        
        setHistoryData(formattedData);
      }
    } catch (err) {
      console.error('Error fetching historical COVID data:', err);
      setHistoryData([]);
    }
  };

  // Handle country selection
  const handleSelectCountry = (country: string) => {
    setSelectedCountry(country);
    setSearchTerm('');
    setShowDropdown(false);
    setFilteredCountries([]);
    
    // Fetch data for the selected country
    setIsLoading(true);
    
    setTimeout(() => {
      fetchCovidData();
    }, 100);
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
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header with title and country selector */}
      <div className="flex items-center justify-between p-2 pb-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-error-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          <h3 className="font-semibold text-gray-800 dark:text-white">COVID-19 Statistics</h3>
        </div>
        <div className="relative">
          <button 
            className="px-2 py-1 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm flex items-center space-x-1"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span>{selectedCountry === 'worldwide' ? 'Global' : selectedCountry}</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDropdown && (
            <div className="absolute z-10 mt-1 w-56 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search country..."
                  className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <ul className="max-h-60 overflow-auto">
                <li 
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 ${selectedCountry === 'worldwide' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : ''}`}
                  onClick={() => handleSelectCountry('worldwide')}
                >
                  Global
                </li>
                {filteredCountries && filteredCountries.length > 0 && filteredCountries.map((country, index) => (
                  <li 
                    key={`country-${index}`}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 ${selectedCountry === country ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : ''}`}
                    onClick={() => handleSelectCountry(country)}
                  >
                    {country}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Loading and error states */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )}
      
      {error && (
        <div className="flex-1 flex items-center justify-center text-error-500 text-center px-4">
          <div>
            <svg className="w-10 h-10 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Data display */}
      {!isLoading && !error && covidData && metrics && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Key stats */}
          <div className="grid grid-cols-3 gap-2 mb-3 px-2">
            <div className="bg-warning-50 dark:bg-warning-900/20 p-2 rounded-lg border border-warning-200 dark:border-warning-800/30">
              <div className="text-warning-800 dark:text-warning-300 text-xs font-medium">Active</div>
              <div className="text-warning-900 dark:text-warning-200 font-bold">{metrics.activeCases}</div>
              <div className="text-warning-700 dark:text-warning-400 text-xs">{metrics.activeRate} of total</div>
            </div>
            <div className="bg-error-50 dark:bg-error-900/20 p-2 rounded-lg border border-error-200 dark:border-error-800/30">
              <div className="text-error-800 dark:text-error-300 text-xs font-medium">Deaths</div>
              <div className="text-error-900 dark:text-error-200 font-bold">{metrics.totalDeaths}</div>
              <div className="text-error-700 dark:text-error-400 text-xs">+{metrics.newDeaths} today</div>
            </div>
            <div className="bg-success-50 dark:bg-success-900/20 p-2 rounded-lg border border-success-200 dark:border-success-800/30">
              <div className="text-success-800 dark:text-success-300 text-xs font-medium">Recovered</div>
              <div className="text-success-900 dark:text-success-200 font-bold">{metrics.totalRecovered}</div>
              <div className="text-success-700 dark:text-success-400 text-xs">+{metrics.newRecovered} today</div>
            </div>
          </div>
          
          {/* Cases table */}
          <div className="px-2 mb-4">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-2 rounded-lg border border-primary-200 dark:border-primary-800/30">
              <div className="flex justify-between items-center">
                <div className="text-primary-800 dark:text-primary-300 text-xs font-medium">Total Cases</div>
                <div className="text-primary-900 dark:text-primary-200 font-bold">{metrics.totalCases}</div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <div className="text-primary-700 dark:text-primary-400 text-xs">New Cases</div>
                <div className="text-primary-800 dark:text-primary-300 text-xs">+{metrics.newCases}</div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <div className="text-primary-700 dark:text-primary-400 text-xs">Critical</div>
                <div className="text-primary-800 dark:text-primary-300 text-xs">{metrics.critical}</div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <div className="text-primary-700 dark:text-primary-400 text-xs">Tests</div>
                <div className="text-primary-800 dark:text-primary-300 text-xs">{metrics.tests}</div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                Updated: {metrics.updated}
              </div>
            </div>
          </div>
          
          {/* Chart for historical data */}
          {historyData.length > 0 && (
            <div className="flex-1 px-2 pb-2">
              <div className="w-full h-full bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Cases Trend (Last 30 Days)</h4>
                <div className="h-[130px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="date" tick={{fontSize: 10}} />
                      <YAxis tick={{fontSize: 10}} />
                      <Tooltip />
                      <Line type="monotone" dataKey="cases" stroke="#6366F1" dot={false} />
                      <Line type="monotone" dataKey="deaths" stroke="#EF4444" dot={false} />
                      {shouldShowRecoveredBar() && (
                        <Line type="monotone" dataKey="recovered" stroke="#10B981" dot={false} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CovidWidget; 