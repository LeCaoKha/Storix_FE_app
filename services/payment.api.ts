import { api } from './axios.instance';

export interface PaymentStatus {
    companyId: number;
    status: string;
    expiryDate?: string;
    planName?: string;
}

/**
 * Lấy trạng thái thanh toán của công ty
 */
export const getPaymentStatus = async (companyId: number): Promise<PaymentStatus> => {
    const res = await api.get(`/api/payments/status`, {
        params: { company_id: companyId }
    });
    return res.data;
};
