import { useAuthStore } from '@/stores';
import axios from 'axios';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com',
  timeout: 120000, // Tăng lên 120s cho server cold start
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    console.log('API Request - Token check:', {
      hasToken: !!token,
      tokenLength: token?.length,
      url: config.url
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error - clear auth state
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
