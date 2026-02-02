export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type OrderType = 'inbound' | 'outbound';

export interface OrderItem {
    id: string;
    productName: string;
    sku: string;
    quantity: number;

    // Warehouse Location
    location?: string;
    locatorCode?: string;
    suggestedLocation?: string;

    // Tracking
    pickedQuantity?: number;
    receivedQuantity?: number;
    scannedQuantity?: number;
    damagedQuantity?: number;

    // Additional Info
    batchNumber?: string;
    expiryDate?: Date;

    status?: 'pending' | 'picked' | 'received' | 'damaged';
    aiPickingOrder?: number; // AI-suggested order for picking
}

export interface Order {
    id: string;
    orderNumber: string;
    type: OrderType;
    status: OrderStatus;
    createdAt: Date;
    updatedAt?: Date;
    completedAt?: Date;

    // Warehouse & Logistics
    warehouse: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedDateTime: Date;
    requiredShipDate?: Date;

    // Outbound specific
    customerName?: string;
    customerCode?: string;
    customerAddress?: string;
    deliveryAddress?: string;
    shippingMethod?: string;

    // Inbound specific
    supplierName?: string;
    supplierCode?: string;
    supplierAddress?: string;
    purchaseOrderNumber?: string;
    arrivalTime?: Date;
    expectedItems?: number;

    items: OrderItem[];
    notes?: string;
    assignedTo?: string;

    // Requisition Reference
    requisitionId?: string;
    requisitionNumber?: string;

    // Progress Tracking
    totalQuantity: number;
    pickedQuantity?: number;
    receivedQuantity?: number;
    timeElapsed?: number; // in seconds
    scanErrorCount?: number;
}

export interface OrderTimeline {
    status: string;
    timestamp: Date;
    description: string;
    completedBy?: string;
}

// Task Types
export type TaskType = 'putaway' | 'count' | 'inbound' | 'outbound';

export interface Task {
    id: string;
    type: TaskType;
    orderNumber: string;
    orderId: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    itemCount: number;
    assignedDateTime: Date;
    location?: string; // For count/putaway tasks
    warehouse: string;
    customerOrSupplier?: string;
    progress?: number; // 0-100%
}

// Issue Report Types
export type IssueType = 'missing' | 'damaged' | 'wrong_location' | 'quality' | 'quantity_mismatch' | 'other';

export interface IssueReport {
    id: string;
    orderId: string;
    orderNumber: string;
    itemId?: string;
    itemName?: string;
    issueType: IssueType;
    description: string;
    reportedBy: string;
    reportedAt: Date;
    photos?: string[];
    resolved?: boolean;
}
