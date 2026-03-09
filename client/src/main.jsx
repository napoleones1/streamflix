import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import axios from 'axios';

// Setup axios defaults for production
if (import.meta.env.PROD) {
  axios.defaults.baseURL = '';
} else {
  axios.defaults.baseURL = 'http://localhost:5000';
}

// Add axios interceptor to handle errors gracefully
axios.interceptors.request.use(
  (config) => {
    // Ensure URL is always a string
    if (config.url && typeof config.url !== 'string') {
      config.url = String(config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Suppress browser extension errors
  if (event.reason && event.reason.message && 
      (event.reason.message.includes('indexOf') || 
       event.reason.message.includes('aborted'))) {
    event.preventDefault();
    console.warn('Suppressed browser extension error:', event.reason.message);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
