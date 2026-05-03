import {
    AddTransferOrderItemRequest,
    CancelTransferOrderRequest,
    CreateTransferOrderRequest,
    ReceiveTransferPayload,
    RejectTransferOrderRequest,
    TransferAvailability, TransferOrder,
    TransferQualityCheckPayload,
    UpdateTransferOrderItemRequest,
    UpdateTransferOrderRequest
} from '@/types/transfer';
import { api } from './axios.instance';

const normalizeTransferOrder = (payload: any): TransferOrder => ({
    id: payload.id,
    sourceWarehouseId: payload.sourceWarehouseId,
    destinationWarehouseId: payload.destinationWarehouseId,
    status: payload.status,
    createdAt: payload.createdAt,
    referenceCode: payload.referenceCode,
    sourceWarehouse: payload.sourceWarehouse || payload.sourceWarehouseName
        ? { name: payload.sourceWarehouse?.name || payload.sourceWarehouseName }
        : undefined,
    destinationWarehouse: payload.destinationWarehouse || payload.destinationWarehouseName
        ? { name: payload.destinationWarehouse?.name || payload.destinationWarehouseName }
        : undefined,
    items: Array.isArray(payload.items)
        ? payload.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
        }))
        : [],
    timeline: Array.isArray(payload.timeline)
        ? payload.timeline.map((row: any) => ({
            id: row.id,
            action: row.action,
            timestamp: row.timestamp,
            userId: row.userId,
            userName: row.userName,
        }))
        : [],
});

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
    return Array.isArray(res.data) ? res.data.map(normalizeTransferOrder) : [];
};

/**
 * Lấy chi tiết lệnh điều chuyển
 */
export const getTransferOrderById = async (id: number) => {
    const res = await api.get(`/api/warehouse-transfers/${id}`);
    return normalizeTransferOrder(res.data);
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

/**
 * Staff: Kiểm tra chất lượng sau khi nhận hàng
 */
export const qualityCheckTransfer = async (id: number, payload: TransferQualityCheckPayload) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/quality-check`, payload);
    return res.data;
};

// ==========================
// MANAGER ACTIONS
// ==========================

export const checkTransferAvailability = async (id: number) => {
    const res = await api.get(`/api/warehouse-transfers/${id}/availability`);
    return res.data as TransferAvailability[];
};

export const createTransferOrder = async (payload: CreateTransferOrderRequest) => {
    const res = await api.post('/api/warehouse-transfers', payload);
    return normalizeTransferOrder(res.data);
};

export const updateTransferOrder = async (id: number, payload: UpdateTransferOrderRequest) => {
    const res = await api.put(`/api/warehouse-transfers/${id}`, payload);
    return normalizeTransferOrder(res.data);
};

export const addTransferOrderItem = async (id: number, payload: AddTransferOrderItemRequest) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/items`, payload);
    return normalizeTransferOrder(res.data);
};

export const updateTransferOrderItem = async (id: number, itemId: number, payload: UpdateTransferOrderItemRequest) => {
    const res = await api.put(`/api/warehouse-transfers/${id}/items/${itemId}`, payload);
    return normalizeTransferOrder(res.data);
};

export const removeTransferOrderItem = async (id: number, itemId: number) => {
    const res = await api.delete(`/api/warehouse-transfers/${id}/items/${itemId}`);
    return normalizeTransferOrder(res.data);
};

export const submitTransferOrder = async (id: number) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/submit`);
    return normalizeTransferOrder(res.data);
};

export const approveTransferOrder = async (id: number) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/approve`);
    return normalizeTransferOrder(res.data);
};

export const rejectTransferOrder = async (id: number, payload: RejectTransferOrderRequest) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/reject`, payload);
    return normalizeTransferOrder(res.data);
};

export const cancelTransferOrder = async (id: number, payload?: CancelTransferOrderRequest) => {
    const res = await api.post(`/api/warehouse-transfers/${id}/cancel`, payload || {});
    return normalizeTransferOrder(res.data);
};
