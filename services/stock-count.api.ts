import { api } from './axios.instance';

// ============== Common Types (Khớp với BE DTOs) ==============

export interface StockCountTicket {
    id: number;
    warehouseId?: number;
    name?: string;
    type?: string;
    status?: string;
    createdAt?: string;
    executedDay?: string;
    finishedDay?: string;
    itemCount: number;
}

export interface StockCountItem {
    id: number;
    productId?: number;
    sku?: string;
    name?: string;
    systemQuantity: number;
    countedQuantity?: number;
    discrepancy?: number;
    status?: string;
    description?: string;
}

export interface StockCountTicketDetail extends StockCountTicket {
    description?: string;
    items: StockCountItem[];
}

export interface UpdateStockCountItemPayload {
    countedQuantity: number;
    description?: string;
    status?: string;
}

// ============== API Functions ==============

/**
 * Lấy danh sách phiếu kiểm kê của công ty
 */
export const getStockCountTickets = async (_companyId: number, warehouseId?: number, status?: string) => {
    // Sử dụng kebab-case để khớp với BE route: [Route("api/stock-count-tickets")]
    const baseUrl = '/api/stock-count-tickets';
    const params = new URLSearchParams();
    if (warehouseId) params.append('warehouseId', warehouseId.toString());
    if (status) params.append('status', status);

    const queryString = params.toString();
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    const res = await api.get(url);
    return res.data as StockCountTicket[];
};

/**
 * Lấy chi tiết phiếu kiểm kê theo ID
 */
export const getStockCountTicketById = async (ticketId: number) => {
    const res = await api.get(`/api/stock-count-tickets/${ticketId}`);
    return res.data as StockCountTicketDetail;
};

/**
 * Cập nhật số lượng đếm thực tế của một item trong phiếu kiểm kê
 */
export const updateStockCountItem = async (itemId: number, payload: UpdateStockCountItemPayload) => {
    const res = await api.patch(`/api/stock-count-items/${itemId}`, payload);
    return res.data as StockCountItem;
};
