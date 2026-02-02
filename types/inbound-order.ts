// Inbound Order Status
export type InboundStatus =
    | 'scheduled'      // Đã lên lịch
    | 'arrived'        // Đã đến kho
    | 'receiving'      // Đang nhận hàng
    | 'putaway'        // Đang cất hàng
    | 'completed'      // Hoàn tất
    | 'cancelled';     // Hủy

export interface InboundItem {
    id: string;
    sku: string;
    productName: string;
    expectedQty: number;           // Số lượng dự kiến
    receivedQty: number;           // Số lượng nhận thực tế
    unit: string;
    batchNumber?: string;
    lotNumber?: string;
    expiryDate?: Date;
    putawayLocation?: string;      // Vị trí cất hàng
    condition?: 'good' | 'damaged' | 'returned';
    notes?: string;
}

export interface InboundOrder {
    id: string;
    inboundNumber: string;         // IN-2026-001
    requisitionId?: string;        // Link to requisition
    requisitionNumber?: string;

    // Supplier info
    supplier: string;
    supplierContact?: string;
    poReference?: string;          // Purchase Order reference

    // Warehouse info
    warehouse: string;
    warehouseLocation?: string;

    // Items
    items: InboundItem[];

    // Status & tracking
    status: InboundStatus;
    expectedArrivalDate: Date;
    actualArrivalDate?: Date;

    // Staff assignment
    receivedBy?: string;           // Staff ID
    receivedByName?: string;

    // Logistics
    carrier?: string;
    trackingNumber?: string;
    billNumber?: string;

    // Attachments
    invoiceUrl?: string;
    packingListUrl?: string;

    // Audit
    createdAt: Date;
    createdBy: string;
    createdByName: string;
    completedAt?: Date;

    notes?: string;
}
