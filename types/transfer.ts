// ============== Warehouse Transfer Types (Khớp với Backend) ==============

export interface TransferOrder {
    id: number;
    sourceWarehouseId: number;
    destinationWarehouseId: number;
    status: string;
    createdAt: string;
    referenceCode?: string;
    sourceWarehouse?: { name: string };
    destinationWarehouse?: { name: string };
    items?: TransferOrderItem[];
}

export interface TransferOrderItem {
    id: number;
    productId: number;
    productName?: string;
    sku?: string;
    quantity: number;
}

export interface ReceiveTransferPayload {
    receivedBy: number;
    note?: string;
    items: { productId: number; receivedQuantity: number }[];
}

// Manager Actions
export interface CreateTransferOrderRequest {
    sourceWarehouseId: number;
    destinationWarehouseId: number;
    submitAfterCreate?: boolean;
}

export interface UpdateTransferOrderRequest {
    destinationWarehouseId?: number;
    referenceCode?: string;
}

export interface AddTransferOrderItemRequest {
    productId: number;
    quantity: number;
}

export interface UpdateTransferOrderItemRequest {
    quantity: number;
}

export interface RejectTransferOrderRequest {
    reason: string;
}

export interface CancelTransferOrderRequest {
    reason?: string;
}
