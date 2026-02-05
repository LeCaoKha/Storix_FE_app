// ============== Inbound Order Types (khớp với Backend) ==============

export type InboundOrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
export type InboundRequestStatus = 'Pending' | 'Approved' | 'Rejected';

// Legacy status types for backward compatibility
export type InboundStatus = 'scheduled' | 'arrived' | 'receiving' | 'putaway' | 'completed' | 'cancelled' | 'pending' | 'received' | 'in_transit';

// ============== API Types (khớp với Backend models) ==============

export interface InboundOrderItem {
  id: number;
  inboundRequestId?: number;
  inboundOrderId?: number;
  productId?: number;
  expectedQuantity?: number;
  receivedQuantity?: number;
  product?: {
    id: number;
    name: string;
    sku?: string;
    unit?: string;
  };
}

export interface InboundOrder {
  id: number;
  inboundRequestId?: number;
  warehouseId?: number;
  supplierId?: number;
  createdBy?: number;
  referenceCode?: string;
  status?: string;
  createdAt?: string;
  inboundOrderItems: InboundOrderItem[];
  supplier?: {
    id: number;
    name: string;
  };
  warehouse?: {
    id: number;
    name: string;
  };
  createdByNavigation?: {
    id: number;
    email: string;
  };
}

export interface InboundRequest {
  id: number;
  warehouseId?: number;
  supplierId?: number;
  requestedBy?: number;
  status?: InboundRequestStatus;
  createdAt?: string;
  approvedAt?: string;
  approverId?: number;
  inboundOrderItems: InboundOrderItem[];
  supplier?: {
    id: number;
    name: string;
  };
  warehouse?: {
    id: number;
    name: string;
  };
}

// ============== Payload Types ==============

export interface CreateInboundRequestPayload {
  warehouseId?: number;
  supplierId?: number;
  requestedBy: number;
  items: { productId: number; expectedQuantity: number }[];
}

export interface UpdateInboundRequestStatusPayload {
  approverId: number;
  status: 'Approved' | 'Rejected';
}

export interface UpdateInboundItemPayload {
  id: number;
  productId: number;
  expectedQuantity?: number;
  receivedQuantity?: number;
}