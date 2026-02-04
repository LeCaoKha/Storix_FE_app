import { api } from './axios.instance';

export interface ProductResponse {
    id: number;
    name: string;
    description: string;
    productTypeId: number;
    companyId: number;
    sku?: string;
    unit?: string;
}


export const getProducts = async (userId: number): Promise<ProductResponse[]> => {
    const res = await api.get(`/api/Products/get-all/${userId}`);
    return res.data;
};
