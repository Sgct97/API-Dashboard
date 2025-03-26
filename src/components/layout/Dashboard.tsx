import React, { useState } from 'react';
import WidgetContainer from '../widgets/WidgetContainer';
import StockWidget from '../widgets/financial/StockWidget';
import CryptoWidget from '../widgets/financial/CryptoWidget';
import WeatherWidget from '../widgets/weather/WeatherWidget';
import AirQualityWidget from '../widgets/weather/AirQualityWidget';
import NewsWidget from '../widgets/news/NewsWidget';
import CovidWidget from '../widgets/covid/CovidWidget';

interface WidgetVisibility {
  stock: boolean;
  crypto: boolean;
  weather: boolean;
  airQuality: boolean;
  news: boolean;
  covid: boolean;
}

interface WidgetInfo {
  id: keyof WidgetVisibility;
  title: string;
  icon: string;
  description: string;
  color: string;
}

const widgets: WidgetInfo[] = [
  { id: 'stock', title: 'Stock Market', icon: 'chart-bar', description: 'Real-time stock market data', color: 'from-blue-500 to-indigo-500' },
  { id: 'crypto', title: 'Cryptocurrency', icon: 'currency-dollar', description: 'Latest crypto prices and trends', color: 'from-primary-500 to-secondary-500' },
  { id: 'weather', title: 'Weather Forecast', icon: 'cloud', description: 'Current weather conditions and forecast', color: 'from-sky-400 to-blue-500' },
  { id: 'airQuality', title: 'Air Quality', icon: 'sparkles', description: 'Air quality and pollution metrics', color: 'from-green-400 to-emerald-500' },
  { id: 'news', title: 'Latest News', icon: 'newspaper', description: 'Breaking news from around the world', color: 'from-amber-400 to-orange-500' },
  { id: 'covid', title: 'COVID-19 Statistics', icon: 'chart-pie', description: 'Pandemic statistics and updates', color: 'from-red-400 to-rose-500' },
];

const Dashboard = () => {
  const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({
    stock: true,
    crypto: true,
    weather: true,
    airQuality: true,
    news: true,
    covid: true,
  });

  const toggleWidget = (widgetName: keyof WidgetVisibility) => {
    setWidgetVisibility(prev => ({
      ...prev,
      [widgetName]: !prev[widgetName]
    }));
  };

  const activeWidgetsCount = Object.values(widgetVisibility).filter(Boolean).length;

  return (
    <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative">
              <div className="absolute -left-4 -top-4 w-20 h-20 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-xl"></div>
              <h1 className="text-3xl font-display font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">Enterprise Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-lg">
                Real-time data integration across multiple APIs. Visualize and monitor critical business metrics in one place.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              {widgets.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => toggleWidget(widget.id)}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                    flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-800
                    ${widgetVisibility[widget.id]
                      ? `bg-gradient-to-r ${widget.color} bg-opacity-10 text-white shadow-sm backdrop-blur-sm` 
                      : 'bg-white/80 text-gray-600 dark:bg-dark-700/80 dark:text-gray-400 hover:bg-white dark:hover:bg-dark-600/90 border border-gray-200/50 dark:border-white/5 backdrop-blur-sm focus:ring-gray-500'}
                  `}
                >
                  <span className={`
                    inline-block w-2 h-2 rounded-full transition-colors
                    ${widgetVisibility[widget.id] 
                      ? 'bg-white' 
                      : 'bg-gray-400 dark:bg-gray-600'}
                  `}></span>
                  {widget.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute top-0 right-0 -mr-4 hidden lg:flex">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Last updated:</span>
              <span className="bg-white/80 dark:bg-dark-700/80 px-2 py-1 rounded-md border border-gray-200/50 dark:border-white/5 backdrop-blur-sm font-mono">
                {new Date().toLocaleTimeString()}
              </span>
              <button className="p-1.5 bg-white/80 dark:bg-dark-700/80 hover:bg-white/90 dark:hover:bg-dark-600/90 rounded-md border border-gray-200/50 dark:border-white/5 text-primary-500 dark:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:focus:ring-primary-500/30 backdrop-blur-sm">
                <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {activeWidgetsCount === 0 ? (
          <div className="glass-card flex items-center justify-center h-64 p-8 text-center neon-glow">
            <div>
              <svg className="h-12 w-12 text-primary-400 dark:text-primary-500 mx-auto mb-4 animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No widgets enabled</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Enable one or more widgets using the toggle buttons above to display data.
              </p>
              <button 
                onClick={() => setWidgetVisibility({stock: true, crypto: true, weather: true, airQuality: true, news: true, covid: true})}
                className="mt-4 btn-primary text-sm py-1.5"
              >
                Enable All Widgets
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {widgetVisibility.stock && (
              <WidgetContainer 
                title="Stock Market" 
                icon="chart-bar" 
                color="from-blue-500 to-indigo-500"
              >
                <StockWidget />
              </WidgetContainer>
            )}
            
            {widgetVisibility.crypto && (
              <WidgetContainer 
                title="Cryptocurrency" 
                icon="currency-dollar" 
                color="from-primary-500 to-secondary-500"
              >
                <CryptoWidget />
              </WidgetContainer>
            )}
            
            {widgetVisibility.weather && (
              <WidgetContainer 
                title="Weather Forecast" 
                icon="cloud" 
                color="from-sky-400 to-blue-500"
              >
                <WeatherWidget />
              </WidgetContainer>
            )}
            
            {widgetVisibility.airQuality && (
              <WidgetContainer 
                title="Air Quality" 
                icon="sparkles" 
                color="from-green-400 to-emerald-500"
              >
                <AirQualityWidget />
              </WidgetContainer>
            )}
            
            {widgetVisibility.news && (
              <WidgetContainer 
                title="Latest News" 
                icon="newspaper" 
                color="from-amber-400 to-orange-500"
              >
                <NewsWidget />
              </WidgetContainer>
            )}
            
            {widgetVisibility.covid && (
              <WidgetContainer 
                title="COVID-19 Statistics" 
                icon="chart-pie" 
                color="from-red-400 to-rose-500"
              >
                <CovidWidget />
              </WidgetContainer>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default Dashboard; 