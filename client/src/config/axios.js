import axios from 'axios';

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: import.meta.env.PROD ? '' : 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default axiosInstance;
