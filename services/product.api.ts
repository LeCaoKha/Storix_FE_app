import type { Product } from '@/types/product';
import { api } from './axios.instance';

export const getProducts = async (userId: number): Promise<Product[]> => {
    const res = await api.get(`/api/Products/get-all/${userId}`);
    return res.data;
};
