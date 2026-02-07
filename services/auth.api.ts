import { LoginResponse } from '@/types/auth.types';
import { api } from './axios.instance';

export const loginRequest = async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post('api/Home/Login', { email, password });
    return res.data;
};

export const logoutRequest = async (): Promise<void> => {
    // No explicit logout endpoint in BE yet

    return Promise.resolve();
};
