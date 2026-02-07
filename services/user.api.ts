import type { User } from '@/types/auth.types';
import { api } from './axios.instance';

export const getUserProfile = async (userId: number): Promise<User> => {
    const res = await api.get(`/api/Users/get-user-profile/${userId}`);
    return res.data;
};

export const getUserById = async (userId: number): Promise<User> => {
    const res = await api.get(`/api/Users/${userId}`);
    return res.data;
};

export const getUsersByWarehouse = async (warehouseId: number): Promise<User[]> => {
    const res = await api.get(`/api/Users/get-users-by-warehouse/${warehouseId}`);
    return res.data;
};
