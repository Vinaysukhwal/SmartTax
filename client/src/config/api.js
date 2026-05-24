/**
 * API Configuration
 * 
 * Sets up Axios with a base URL pointing to our Express backend.
 * The auth token interceptor is added in AuthContext.jsx.
 */

import axios from 'axios';

// Create an Axios instance with the backend base URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;
