import { useState, useEffect } from 'react';

const WeatherTest = () => {
  const [result, setResult] = useState<string>('Testing API connection...');
  const [loading, setLoading] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().slice(11, 19)} - ${message}`]);
  };

  useEffect(() => {
    const testApi = async () => {
      try {
        const apiKey = '5699e21331fbb2139b964872b3ea0a09';
        addLog('Testing OpenWeatherMap API connection...');
        addLog(`API Key: ${apiKey.slice(0, 5)}...${apiKey.slice(-5)}`);
        
        // Try with direct fetch first
        addLog('Making direct fetch request...');
        const testResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${apiKey}`,
          {
            mode: 'cors',
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        addLog(`API response status: ${testResponse.status} ${testResponse.statusText}`);
        
        if (testResponse.ok) {
          const data = await testResponse.json();
          addLog('Successfully received API data');
          addLog(`City: ${data.name}, Weather: ${data.weather[0].description}`);
          addLog(`Temperature: ${Math.round(data.main.temp - 273.15)}°C`);
          setResult(`API connection successful! Weather in London: ${data.weather[0].description}, temp: ${Math.round(data.main.temp - 273.15)}°C`);
        } else {
          const errorText = await testResponse.text();
          addLog(`API error response: ${errorText}`);
          setResult(`API error: ${testResponse.status} - ${errorText}`);
        }
      } catch (err) {
        console.error('API connection test failed:', err);
        addLog(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setResult(`API connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    testApi();
  }, []);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Weather API Test</h3>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="p-3 mb-3 bg-gray-100 dark:bg-gray-900 rounded">
            <div className={result.includes('successful') ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
              {result}
            </div>
          </div>
          
          <div className="text-sm font-medium mb-2">Request logs:</div>
          <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono h-36 overflow-auto">
            {logs.map((log, idx) => (
              <div key={idx} className="mb-1">{log}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherTest; 