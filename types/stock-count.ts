// ============== Stock Count Types (Khớp với Backend) ==============

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
    description?: string;
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
    locationId?: number;
}

export interface StockCountTicketDetail extends StockCountTicket {
    items: StockCountItem[];
}

export interface UpdateStockCountItemPayload {
    countedQuantity: number;
    description?: string;
    status?: string;
    productId?: number;
    locationId?: number | null;
}

/**
 * Thông tin tồn kho thực tế của một sản phẩm trong kho
 */
export interface WarehouseInventoryItem {
    productId: number;
    sku?: string;
    name?: string;
    totalQuantity: number;
    binDetails?: {
        zoneCode?: string;
        shelfCode?: string;
        levelCode?: string;
        binCode?: string;
        quantity: number;
    }[];
}
