export type RequisitionStatus = 'Pending' | 'Approved' | 'Rejected' | 'Created';
export type RequisitionType = 'inbound' | 'outbound';

export interface RequisitionItem {
    id: number; // ProductId
    sku: string;
    productName: string;
    quantity: number;
    unit: string;
}

export interface GoodsRequisition {
    id: number;
    requisitionNumber: string;
    type: RequisitionType;
    status: RequisitionStatus;

    // Backend compatible fields
    warehouseId: number;
    supplierId: number;
    requestedBy: number;

    // Dates
    createdAt: Date;
    approvedAt?: Date;

    // Items
    items: RequisitionItem[];

    // Display fields (optional for BE)
    warehouseName?: string;
    supplierName?: string;
    requestedByName?: string;
}

