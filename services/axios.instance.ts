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
  (response) => {
    const isInboundRequest = response.config.url?.includes('/InventoryInbound/requests/');

    if (isInboundRequest) {
      console.log(`[AXIOS SUCCESS - FULL DATA] ${response.config.url}`);
      console.log('Full Response:', JSON.stringify(response.data, null, 2));
    } else {
      console.log(`[AXIOS SUCCESS] ${response.config.url}`, {
        status: response.status,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data).slice(0, 10) : [],
        data: JSON.stringify(response.data).substring(0, 200) + '...'
      });
    }
    return response;
  },
  (error) => {
    console.error(`[AXIOS ERROR] ${error.config?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      errorData: error.response?.data,
      errorMessage: error.message
    });

    // Only logout on 401 if it's an auth-related endpoint
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/Login') || url.includes('/auth/') || url.includes('/token');
      
      // Only auto-logout for auth endpoints, not regular API calls
      // Regular 401s might be due to expired tokens that can be refreshed
      if (isAuthEndpoint) {
        console.log('[AUTH] Unauthorized on auth endpoint, logging out');
        useAuthStore.getState().logout();
      } else {
        console.warn('[AUTH] Unauthorized on API call, but not logging out automatically');
      }
    }
    return Promise.reject(error);
  }
);
