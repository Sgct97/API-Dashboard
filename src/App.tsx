import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/layout/Header';
import Dashboard from './components/layout/Dashboard';

// Force app refresh to debug weather API

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-tr from-gray-50 via-white to-blue-50 dark:bg-gradient-to-br dark:from-dark-900 dark:via-dark-800 dark:to-primary-900/20 transition-all duration-500 ease-in-out">
        {/* Background elements */}
        <div className="fixed inset-0 grid-pattern opacity-40 dark:opacity-20 pointer-events-none"></div>
        
        {/* Glowing orbs */}
        <div className="orb orb-1 w-[500px] h-[500px] -top-64 -left-32"></div>
        <div className="orb orb-2 w-[600px] h-[600px] -bottom-96 -right-32"></div>
        <div className="orb orb-3 w-[400px] h-[400px] top-1/3 -right-64 opacity-20"></div>
        
        {/* Radial gradient accent */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent dark:from-primary-600/20 dark:via-dark-900/5 dark:to-transparent pointer-events-none"></div>
        
        {/* Content */}
        <Header />
        <Dashboard />
      </div>
    </ThemeProvider>
  );
}

export default App; 