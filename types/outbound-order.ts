// Outbound Order Status
export type OutboundStatus =
    | 'open'           // Mới tạo
    | 'picking'        // Đang lấy hàng
    | 'packing'        // Đang đóng gói
    | 'ready'          // Sẵn sàng giao
    | 'shipped'        // Đã xuất kho
    | 'completed'      // Hoàn tất
    | 'cancelled';     // Hủy

export interface PickLocation {
    locationId: string;
    locationCode: string;           // A-01-02
    quantity: number;
    sequence?: number;              // Thứ tự pick tối ưu
}

export interface OutboundItem {
    id: string;
    sku: string;
    productName: string;
    qtyToPick: number;              // Số lượng cần lấy
    qtyPicked: number;              // Đã lấy thực tế
    unit: string;
    pickLocations: PickLocation[];  // Các vị trí lấy hàng
    batchNumber?: string;
    lotNumber?: string;
    serialNumbers?: string[];
    notes?: string;
}

export interface OutboundOrder {
    id: string;
    outboundNumber: string;         // OUT-2026-001
    requisitionId?: string;
    requisitionNumber?: string;

    // Customer info
    customer: string;
    customerContact?: string;
    destination: string;
    salesOrderRef?: string;         // Sales Order reference

    // Warehouse info
    warehouse: string;

    // Items & picking
    items: OutboundItem[];
    optimizedRoute?: string[];      // AI route optimization

    // Status & tracking
    status: OutboundStatus;
    expectedShipDate: Date;
    actualShipDate?: Date;

    // Staff assignment
    pickedBy?: string;              // Staff ID
    pickedByName?: string;
    packedBy?: string;
    packedByName?: string;

    // Shipping
    shipMethod?: string;
    carrier?: string;
    trackingNumber?: string;

    // Audit
    createdAt: Date;
    createdBy: string;
    createdByName: string;
    completedAt?: Date;

    notes?: string;
}
