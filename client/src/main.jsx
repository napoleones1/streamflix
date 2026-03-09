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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
