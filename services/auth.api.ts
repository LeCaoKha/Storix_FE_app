import { LoginResponse } from '@/types/auth.types';
import { api } from './axios.instance';

export const loginRequest = async (email: string, password: string): Promise<LoginResponse> => {
    console.log('[LOGIN] Attempting login with:', { email, password, url: '/api/Home/Login' });
    try {
        const res = await api.post('/api/Home/Login', { email, password });
        const normalizedResponse: LoginResponse = {
            accessToken: res.data?.accessToken ?? res.data?.AccessToken,
            refreshToken: res.data?.refreshToken ?? res.data?.RefreshToken,
            userId: res.data?.userId ?? res.data?.UserId,
            roleId: res.data?.roleId ?? res.data?.RoleId,
            companyId: res.data?.companyId ?? res.data?.CompanyId,
            warehouseId: res.data?.warehouseId ?? res.data?.WarehouseId,
            warehouseName: res.data?.warehouseName ?? res.data?.WarehouseName,
        };

        console.log('[LOGIN] Success:', { status: res.status, userId: normalizedResponse.userId, roleId: normalizedResponse.roleId, warehouseId: normalizedResponse.warehouseId });
        return normalizedResponse;
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
