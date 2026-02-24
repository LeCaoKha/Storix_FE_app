import { LoginResponse } from '@/types/auth.types';
import { api } from './axios.instance';

export const loginRequest = async (email: string, password: string): Promise<LoginResponse> => {
    console.log('[LOGIN] Attempting login with:', { email, password, url: '/api/Home/Login' });
    try {
        const res = await api.post('/api/Home/Login', { email, password });
        console.log('[LOGIN] Success:', { status: res.status, role: res.data?.roleName, userId: res.data?.id });
        return res.data;
    } catch (error: any) {
        console.error('[LOGIN] Failed:', {
            status: error.response?.status,
            data: error.response?.data,
            email,
            password,
        });
        throw error;
    }
};

export const logoutRequest = async (refreshToken: string | null): Promise<void> => {
    if (!refreshToken) return;

    try {
        await api.post('/api/Home/logout', { refreshToken });
    } catch (error) {
        console.warn('[LOGOUT] API call failed, but clearing local session anyway:', error);
    }
};
