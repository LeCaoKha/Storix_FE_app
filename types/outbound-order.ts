// ============== Outbound Order Types (khớp với Backend) ==============

// OutboundOrder statuses từ BE:
// Created -> Picking -> QualityCheck -> IssueReported/Packing -> LoadHandover -> Completed
export type OutboundOrderStatus = 
  | 'Created' 
  | 'Picking' 
  | 'QualityCheck' 
  | 'IssueReported' 
  | 'Packing' 
  | 'LoadHandover' 
  | 'Completed';

// OutboundRequest statuses từ BE: Pending -> Approved/Rejected
export type OutboundRequestStatus = 'Pending' | 'Approved' | 'Rejected';

// Legacy status types for backward compatibility
export type OutboundStatus = 'open' | 'picking' | 'packing' | 'ready' | 'shipped' | 'completed' | 'delivered' | 'cancelled' | 'on_hold';

// ============== API Types (khớp với Backend models) ==============

export interface OutboundOrderItem {
  id: number;
  outboundRequestId?: number;
  outboundOrderId?: number;
  productId?: number;
  quantity?: number;
  receivedQuantity?: number;
  price?: number;
  // Flat fields from BE DTO (OutboundOrderItemDto)
  productName?: string;
  name?: string; // Legacy
  sku?: string;
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
  outboundOrderItems?: OutboundOrderItem[]; // Legacy field
  items?: OutboundOrderItem[]; // Backend DTO field
  warehouse?: {
    id: number;
    name: string;
  };
  createdByUser?: {
    id: number;
    fullName?: string;
    email?: string;
  };
  staffUser?: {
    id: number;
    fullName?: string;
    email?: string;
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
  outboundOrderItems?: OutboundOrderItem[]; // Legacy field
  items?: OutboundOrderItem[]; // Backend DTO field
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
  allocations: {
    productId: number;
    binId: number;
    quantity: number;
  }[];
}

export interface InventoryAvailability {
  productId: number;
  availableQuantity: number;
}

// TicketStatus alias – dùng chung với OutboundOrderStatus
export type TicketStatus = OutboundOrderStatus;

// ============== FIFO Suggestion Types ==============

export interface FifoSuggestion {
  binIdCode?: string;
  binCode?: string;
  shelfCode?: string;
  zoneId?: number;
  availableInBin?: number;
  suggestedPickQty?: number;
  batchId?: number;
}

export interface FifoSuggestionItem {
  outboundOrderItemId: number;
  productId: number;
  productName?: string;
  requiredQuantity?: number;
  isFullyCoverable?: boolean;
  totalAvailableQuantity?: number;
  remainingQuantity?: number;
  suggestions?: FifoSuggestion[];
}

export interface FifoSummary {
  requiredQuantity: number;
  totalAvailableQuantity: number;
  remainingQuantity: number;
}

// ============== Path Optimization Types ==============

export interface PathOptimizationLocation {
  rawFifoSuggestions?: FifoSuggestion[];
}

export interface PathOptimizationItem {
  productId: number;
  locationData?: PathOptimizationLocation;
}

export interface PathOptimizationPayload {
  status: string;
  itemsToPick?: PathOptimizationItem[];
  fullOptimizedPath?: string[];
}

export interface PathOptimizationResponse {
  payload?: PathOptimizationPayload[];
}

// ============== Handover Payload Types ==============

export interface HandoverLocation {
  binId: string | undefined;
  quantity: number;
  batchId?: number;
}

export interface HandoverItemPayload {
  id: number;
  productId: number;
  expectedQuantity: number;
  receivedQuantity: number;
  locations: HandoverLocation[];
}
