import type { Product, ProductInventoryLocation } from '@/types/product';

import { api } from './axios.instance';

export const getProducts = async (userId: number): Promise<Product[]> => {
    const res = await api.get(`/api/Products/get-all/${userId}`);
    return res.data;
};

export const getProductInventoryLocations = async (
    userId: number,
    productId: number,
    warehouseId: number
): Promise<ProductInventoryLocation[]> => {
    const res = await api.get(`/api/Products/inventory-locations/${userId}/${productId}/warehouse/${warehouseId}`);
    return res.data;
};
