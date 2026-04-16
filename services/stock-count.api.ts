import {
    StockCountItem,
    StockCountTicket,
    StockCountTicketDetail,
    UpdateStockCountItemPayload,
    WarehouseInventoryItem
} from '@/types/stock-count';
import { api } from './axios.instance';

type RawStockCountItem = {
    id: number;
    productId?: number | null;
    systemQuantity?: number | null;
    countedQuantity?: number | null;
    discrepancy?: number | null;
    status?: boolean | null;
    description?: string | null;
    locationId?: number | null;
    product?: {
        sku?: string | null;
        name?: string | null;
    } | null;
};

type RawStockCountTicket = {
    id: number;
    warehouseId?: number | null;
    name?: string | null;
    type?: string | null;
    status?: string | null;
    createdAt?: string | null;
    executedDay?: string | null;
    finishedDay?: string | null;
    description?: string | null;
    inventoryCountItems?: RawStockCountItem[] | null;
};

const mapStockCountItem = (item: RawStockCountItem): StockCountItem => ({
    id: item.id,
    productId: item.productId ?? undefined,
    sku: item.product?.sku ?? undefined,
    name: item.product?.name ?? undefined,
    systemQuantity: item.systemQuantity ?? 0,
    countedQuantity: item.countedQuantity ?? undefined,
    discrepancy: item.discrepancy ?? undefined,
    status: typeof item.status === 'boolean' ? String(item.status) : undefined,
    description: item.description ?? undefined,
    locationId: item.locationId ?? undefined,
});

const mapStockCountTicket = (ticket: RawStockCountTicket): StockCountTicket => {
    const items = ticket.inventoryCountItems ?? [];
    return {
        id: ticket.id,
        warehouseId: ticket.warehouseId ?? undefined,
        name: ticket.name ?? undefined,
        type: ticket.type ?? undefined,
        status: ticket.status ?? undefined,
        createdAt: ticket.createdAt ?? undefined,
        executedDay: ticket.executedDay ?? undefined,
        finishedDay: ticket.finishedDay ?? undefined,
        itemCount: items.length,
        description: ticket.description ?? undefined,
    };
};

const mapStockCountTicketDetail = (ticket: RawStockCountTicket): StockCountTicketDetail => {
    const base = mapStockCountTicket(ticket);
    return {
        ...base,
        items: (ticket.inventoryCountItems ?? []).map(mapStockCountItem),
    };
};

// ============== API Functions ==============

/**
 * Lấy danh sách phiếu kiểm kê của công ty/kho
 * BE Route: GET /api/InventoryCount/tickets/{companyId}
 * Roles: 2, 3, 4
 */
export const getStockCountTickets = async (_companyId: number, warehouseId?: number, status?: string) => {
    const res = await api.get(`/api/InventoryCount/tickets/${_companyId}`);
    const tickets = (res.data as RawStockCountTicket[]).map(mapStockCountTicket);

    return tickets.filter((ticket) => {
        const matchesWarehouse = !warehouseId || ticket.warehouseId === warehouseId;
        const matchesStatus = !status || ticket.status?.toLowerCase() === status.toLowerCase();
        return matchesWarehouse && matchesStatus;
    });
};

/**
 * Lấy danh sách phiếu kiểm kê được gán cho staff
 * BE Route: GET /api/InventoryCount/get-tasks-for-staff/{companyId}/{staffId}
 * Roles: 2, 3, 4
 */
export const getStockCountTicketsByStaff = async (companyId: number, staffId: number) => {
    const res = await api.get(`/api/InventoryCount/get-tasks-for-staff/${companyId}/${staffId}`);
    return (res.data as RawStockCountTicket[]).map(mapStockCountTicket);
};

/**
 * Lấy chi tiết phiếu kiểm kê theo ID
 * BE Route: GET /api/InventoryCount/tickets/{companyId}/{ticketId}
 * Roles: 2, 3, 4
 */
export const getStockCountTicketById = async (companyId: number, ticketId: number) => {
    const res = await api.get(`/api/InventoryCount/tickets/${companyId}/${ticketId}`);
    return mapStockCountTicketDetail(res.data as RawStockCountTicket);
};

/**
 * Cập nhật số lượng đếm thực tế của một hoặc nhiều item trong phiếu kiểm kê
 * BE Route: PUT /api/InventoryCount/tickets/{ticketId}/items
 * Roles: 3, 4
 */
export const updateStockCountTicketItems = async (
    ticketId: number,
    payload: {
        performedBy: number;
        items: {
            stockCountItemId: number;
            productId?: number;
            countedQuantity?: number;
            binId?: string | null;
        }[];
    }
) => {
    const res = await api.put(`/api/InventoryCount/tickets/${ticketId}/items`, payload);
    return mapStockCountTicketDetail(res.data as RawStockCountTicket);
};

/**
 * Export type payload for stock count update
 */
export type { UpdateStockCountItemPayload };

/**
 * Lấy danh sách tồn kho thực tế trong một kho (theo productIds tuỳ chọn)
 * BE Route: GET /api/company-warehouses/{companyId}/warehouses/{warehouseId}/inventory
 * Roles: 2, 3, 4
 */
export const getWarehouseInventory = async (
    companyId: number,
    warehouseId: number,
    productIds?: number[]
): Promise<WarehouseInventoryItem[]> => {
    const params = new URLSearchParams();
    if (productIds && productIds.length > 0) {
        productIds.forEach(id => params.append('productIds', id.toString()));
    }

    const queryString = params.toString();
    const url = queryString
        ? `/api/company-warehouses/${companyId}/warehouses/${warehouseId}/inventory?${queryString}`
        : `/api/company-warehouses/${companyId}/warehouses/${warehouseId}/inventory`;

    const res = await api.get(url);
    return res.data?.items ?? res.data ?? [];
};

/**
 * Lấy thông tin tồn kho của một sản phẩm cụ thể trong kho
 * BE Route: GET /api/company-warehouses/{companyId}/warehouses/{warehouseId}/inventory/{productId}
 * Roles: 2, 3, 4
 */
export const getSingleInventoryItem = async (
    companyId: number,
    warehouseId: number,
    productId: number
): Promise<WarehouseInventoryItem | null> => {
    try {
        const res = await api.get(
            `/api/company-warehouses/${companyId}/warehouses/${warehouseId}/inventory/${productId}`
        );
        return res.data?.item ?? res.data ?? null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

/**
 * Lấy tồn kho của nhiều sản phẩm cùng lúc (batch query)
 * BE Route: GET /api/company-warehouses/{companyId}/warehouses/{warehouseId}/inventories?productIds=1&productIds=2...
 * Roles: 2, 3, 4
 */
export const getMultipleInventoryItems = async (
    companyId: number,
    warehouseId: number,
    productIds: number[]
): Promise<{ requestedCount: number; foundCount: number; items: WarehouseInventoryItem[] }> => {
    const params = new URLSearchParams();
    productIds.forEach(id => params.append('productIds', id.toString()));

    const res = await api.get(
        `/api/company-warehouses/${companyId}/warehouses/${warehouseId}/inventories?${params.toString()}`
    );
    return res.data;
};

/**
 * Rà soát tồn kho trước khi tạo phiếu kiểm kê (Manager only)
 * BE Route: GET /api/inventory-count-tickets/warehouses/{warehouseId}/inventory-products
 * Roles: 3
 */
export const listInventoryProducts = async (
    warehouseId: number,
    productIds?: number[]
): Promise<WarehouseInventoryItem[]> => {
    const params = new URLSearchParams();
    if (productIds && productIds.length > 0) {
        productIds.forEach(id => params.append('productIds', id.toString()));
    }

    const queryString = params.toString();
    const url = queryString
        ? `/api/inventory-count-tickets/warehouses/${warehouseId}/inventory-products?${queryString}`
        : `/api/inventory-count-tickets/warehouses/${warehouseId}/inventory-products`;

    const res = await api.get(url);
    return res.data ?? [];
};
