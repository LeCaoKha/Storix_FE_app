import { api } from '@/services/axios.instance';
import { LoginResponse } from './auth.types';

export const loginRequest = async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post('/api/Home/Login', { email, password });
    return res.data;
};

export const logoutRequest = async (): Promise<void> => {
    // No explicit logout endpoint in BE yet

    return Promise.resolve();
};
