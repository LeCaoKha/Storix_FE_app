import { useAuthStore } from '@/stores/auth.store';
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://storix-docker.onrender.com',
    timeout: 30000, // Tăng timeout lên 30s cho production
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export { api };

