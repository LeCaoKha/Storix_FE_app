export type RequisitionStatus = 'pending' | 'approved' | 'rejected';
export type RequisitionType = 'inbound' | 'outbound';

export interface RequisitionItem {
    id: string;
    sku: string;
    productName: string;
    quantity: number;
    unit: string;
    notes?: string;

    // Batch/Lot tracking
    batchNumber?: string;
    lotNumber?: string;
    expiryDate?: Date;
    serialNumbers?: string[];
}

export interface GoodsRequisition {
    id: string;
    requisitionNumber: string;
    type: RequisitionType;
    status: RequisitionStatus;

    // Business context
    purpose: string;
    department?: string;
    project?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';

    // Dates
    expectedDate: Date;
    expectedDeliveryDate?: Date;
    createdAt: Date;

    // Warehouse
    warehouse: string;

    // Items
    items: RequisitionItem[];

    // Partner info
    supplier?: string;
    customer?: string;

    // Creator
    createdBy: string;
    createdByName: string;

    // Approval
    reviewedBy?: string;
    reviewedByName?: string;
    reviewedAt?: Date;
    rejectionReason?: string;

    // Order linking
    linkedOrderId?: string;
    linkedOrderNumber?: string;

    notes?: string;
}
