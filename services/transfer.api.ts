import { 
    ReceiveTransferPayload, TransferOrder,
    CreateTransferOrderRequest, UpdateTransferOrderRequest,
    AddTransferOrderItemRequest, UpdateTransferOrderItemRequest,
    RejectTransferOrderRequest, CancelTransferOrderRequest
} from '@/types/transfer';
import { api } from './axios.instance';

/**
 * Lấy danh sách lệnh điều chuyển kho
 */
export const getTransferOrders = async (params: { 
    sourceWarehouseId?: number; 
    destinationWarehouseId?: number; 
    status?: string;
}) => {
    const query = new URLSearchParams();
    if (params.sourceWarehouseId) query.append('sourceWarehouseId', params.sourceWarehouseId.toString());
    if (params.destinationWarehouseId) query.append('destinationWarehouseId', params.destinationWarehouseId.toString());
    if (params.status) query.append('status', params.status);

    const res = await api.get(`/api/warehouse-transfers?${query.toString()}`);
    return res.data as TransferOrder[];
};

/**
 * Lấy chi tiết lệnh điều chuyển
 */
export const getTransferOrderById = async (id: number) => {
    const res = await api.get(`/api/warehouse-transfers/${id}`);
    return res.data as TransferOrder;
};

/**
 * Staff: Bắt đầu lấy hàng điều chuyển
 */
export const startTransferPicking = async (id: number) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/start-picking`);
    return res.data;
};

/**
 * Staff: Đánh giá đã đóng gói xong
 */
export const markTransferPacked = async (id: number) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/mark-packed`);
    return res.data;
};

/**
 * Staff: Bắt đầu giao hàng (shipping)
 */
export const shipTransfer = async (id: number) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/ship`);
    return res.data;
};

/**
 * Staff: Nhận hàng điều chuyển tại kho đích
 */
export const receiveTransfer = async (id: number, payload: ReceiveTransferPayload) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/receive`, payload);
    return res.data;
};

// ==========================
// MANAGER ACTIONS
// ==========================

export const checkTransferAvailability = async (id: number) => {
    const res = await api.get(`/api/warehouse-transfers/${id}/availability`);
    return res.data;
};

export const createTransferOrder = async (payload: CreateTransferOrderRequest) => {
    const res = await api.post('/api/warehouse-transfers', payload);
    return res.data;
};

export const updateTransferOrder = async (id: number, payload: UpdateTransferOrderRequest) => {
    const res = await api.put(`/api/warehouse-transfers/${id}`, payload);
    return res.data;
};

export const addTransferOrderItem = async (id: number, payload: AddTransferOrderItemRequest) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/items`, payload);
    return res.data;
};

export const updateTransferOrderItem = async (id: number, itemId: number, payload: UpdateTransferOrderItemRequest) => {
    const res = await api.put(`/api/warehouse-transfers/${id}/items/${itemId}`, payload);
    return res.data;
};

export const removeTransferOrderItem = async (id: number, itemId: number) => {
    const res = await api.delete(`/api/warehouse-transfers/${id}/items/${itemId}`);
    return res.data;
};

export const submitTransferOrder = async (id: number) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/submit`);
    return res.data;
};

export const approveTransferOrder = async (id: number) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/approve`);
    return res.data;
};

export const rejectTransferOrder = async (id: number, payload: RejectTransferOrderRequest) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/reject`, payload);
    return res.data;
};

export const cancelTransferOrder = async (id: number, payload?: CancelTransferOrderRequest) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/cancel`, payload || {});
    return res.data;
};
