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
    timeline?: TransferTimelineItem[];
}

export interface TransferTimelineItem {
    id: number;
    action?: string;
    timestamp?: string;
    userId?: number;
    userName?: string;
}

export interface TransferAvailability {
    productId: number;
    productName?: string;
    requiredQuantity: number;
    availableQuantity: number;
    isEnough: boolean;
}

export interface TransferOrderItem {
    id: number;
    productId: number;
    productName?: string;
    sku?: string;
    quantity: number;
}

export interface ReceiveTransferItemRequest {
    productId: number;
    receivedQuantity: number;
    damagedQuantity?: number;
}

export interface ReceiveTransferOrderRequest {
    note?: string;
    items: ReceiveTransferItemRequest[];
}

// Backward-compatible alias for existing hook/service signatures.
export type ReceiveTransferPayload = ReceiveTransferOrderRequest;

export interface TransferQualityCheckItemRequest {
    productId: number;
    okQuantity: number;
    badQuantity: number;
    note?: string;
}

export interface TransferQualityCheckPayload {
    note?: string;
    items: TransferQualityCheckItemRequest[];
}

// Manager Actions
export interface CreateTransferOrderRequest {
    sourceWarehouseId: number;
    destinationWarehouseId: number;
    carrierUserId?: number;
    submitAfterCreate?: boolean;
}

export interface UpdateTransferOrderRequest {
    sourceWarehouseId?: number;
    destinationWarehouseId?: number;
    carrierUserId?: number;
    referenceCode?: string;
}

export interface AddTransferOrderItemRequest {
    productId: number;
    quantity: number;
}

export interface UpdateTransferOrderItemRequest {
    productId: number;
    quantity: number;
}

export interface RejectTransferOrderRequest {
    reason: string;
}

export interface CancelTransferOrderRequest {
    reason?: string;
}
