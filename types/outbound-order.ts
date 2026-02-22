// ============== Outbound Order Types (khớp với Backend) ==============

export type OutboundOrderStatus = 'Pending' | 'Picking' | 'Packed' | 'Ready' | 'Shipped' | 'Completed' | 'Cancelled';
export type OutboundRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed';

// Legacy status types for backward compatibility
export type OutboundStatus = 'open' | 'picking' | 'packing' | 'ready' | 'shipped' | 'completed' | 'delivered' | 'cancelled' | 'on_hold';

// ============== API Types (khớp với Backend models) ==============

export interface OutboundOrderItem {
  id: number;
  outboundRequestId?: number;
  outboundOrderId?: number;
  productId?: number;
  quantity?: number;
  price?: number;
  product?: {
    id: number;
    name: string;
    sku?: string;
    unit?: string;
  };
}

export interface OutboundOrder {
  id: number;
  outboundRequestId?: number;
  warehouseId?: number;
  createdBy?: number;
  destination?: string;
  staffId?: number;
  status?: string;
  note?: string;
  createdAt?: string;
  outboundOrderItems: OutboundOrderItem[];
  warehouse?: {
    id: number;
    name: string;
  };
  createdByNavigation?: {
    id: number;
    email: string;
  };
  staff?: {
    id: number;
    email: string;
  };
}

export interface OutboundRequest {
  id: number;
  warehouseId?: number;
  destination?: string;
  requestedBy?: number;
  status?: OutboundRequestStatus;
  createdAt?: string;
  approvedAt?: string;
  approverId?: number;
  outboundOrderItems: OutboundOrderItem[];
  warehouse?: {
    id: number;
    name: string;
  };
}

// ============== Payload Types ==============

export interface CreateOutboundRequestPayload {
  warehouseId?: number;
  destination?: string;
  requestedBy: number;
  items: { productId: number; quantity: number }[];
}

export interface UpdateOutboundRequestStatusPayload {
  approverId: number;
  status: string;
}

export interface UpdateOutboundItemPayload {
  id: number;
  productId: number;
  quantity?: number;
}

export interface CreateOutboundTicketPayload {
  createdBy: number;
  staffId?: number;
  note?: string;
}

export interface UpdateOutboundStatusPayload {
  performedBy: number;
  status: string;
}

export interface ConfirmOutboundPayload {
  performedBy: number;
}

export interface InventoryAvailability {
  productId: number;
  availableQuantity: number;
}