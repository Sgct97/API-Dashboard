import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

// Simple navigation with just Dashboard
const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', active: true },
];

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <header className="relative z-10 glass-card shadow-md dark:shadow-none dark:border-b dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top header with logo and actions */}
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="flex items-center group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg group-hover:shadow-primary-500/40 dark:group-hover:shadow-primary-400/20 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
              </div>
              <h1 className="ml-3 font-display text-xl font-semibold tracking-tight text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                <span className="font-bold">API</span> Dashboard
              </h1>
            </div>
            <div className="hidden md:flex">
              <span className="inline-flex items-center ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800/30">
                Enterprise
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search (disabled but styled) */}
            <div className="hidden md:block relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-primary-500 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="bg-white/70 dark:bg-dark-700/70 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 outline-none border border-gray-200/50 dark:border-white/5 backdrop-blur-sm transition-all duration-300 hover:border-primary-300 dark:hover:border-primary-700/50"
                placeholder="Search..."
                aria-label="Search"
                disabled
              />
            </div>

            {/* Connection Status Indicator */}
            <div className="hidden md:flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-50"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
              </span>
              <span className="text-xs text-success-700 dark:text-success-400">Online</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/80 dark:bg-dark-700/80 hover:bg-white dark:hover:bg-dark-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-200/50 dark:border-white/5 shadow-sm"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-700" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Navigation tabs - only show Dashboard tab */}
        <div className="border-b border-gray-200/80 dark:border-white/5">
          <nav className="-mb-px flex space-x-8">
            <button
              className="whitespace-nowrap py-4 px-1 border-b-2 border-primary-500 text-primary-600 dark:text-primary-400 dark:border-primary-500 glow-text font-medium text-sm transition-all duration-300"
            >
              Dashboard
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 