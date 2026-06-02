// ============== Inbound Order Types (khớp với Backend) ==============

// InboundOrder statuses từ BE: Waiting for payment -> Partially Completed -> Completed
export type InboundOrderStatus = 'Waiting for payment' | 'Partially Completed' | 'Completed';

// InboundRequest statuses từ BE: Pending -> Approved/Rejected -> Transported (khi tạo Order)
export type InboundRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Transported';

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
  // Direct fields from backend (not nested in product object)
  name?: string;
  sku?: string;
  productName?: string;
  description?: string;
  typeId?: number;
  price?: number;
  discount?: number;
  lineDiscount?: number;
  // Nested product object for backward compatibility
  product?: {
    id: number;
    name: string;
    sku?: string;
    unit?: string;
  };
}

export interface StorageRecommendation {
  id: number;
  recommendationId?: number;
  binId?: number;
  binIdCode?: string;
  path?: string;
  distanceInfo?: number;
  quantity?: number;
  reason?: string;
  createdAt?: string;
}

export interface InboundItemStorageRecommendations {
  inboundOrderItemId: number;
  productId?: number;
  sku?: string;
  name?: string;
  storageRecommendations: StorageRecommendation[];
}

export interface InboundOrder {
  id: number;
  inboundRequestId?: number;
  warehouseId?: number;
  supplierId?: number;
  createdBy?: number;
  staffId?: number;
  referenceCode?: string;
  status?: string;
  note?: string;
  expectedArrivalDate?: string;
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
  approvedBy?: number;
  status?: InboundRequestStatus;
  totalPrice?: number;
  orderDiscount?: number;
  finalPrice?: number;
  code?: string;
  note?: string;
  expectedArrivalDate?: string; // Backend field name
  createdAt?: string;
  approvedAt?: string;
  inboundOrderItems: InboundOrderItem[];
  supplier?: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
  };
  warehouse?: {
    id: number;
    name: string;
    address?: string;
    description?: string;
    width?: number;
    height?: number;
    length?: number;
  };
  requestedByUser?: {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
  };
  approvedByUser?: {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
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
  locations?: {
    binId: string;
    quantity: number;
  }[];
}

// ============== Quality Check Types ==============

export interface QualityCheckItemDto {
  qualityCheckId: number;
  inboundOrderItemId: number;
  productId: number;
  productName: string;
  sku: string;
  receivedQuantity: number;
  passedQuantity: number;
  failedQuantity: number;
  failureReason?: string;
  notes?: string;
  inspectedBy: number;
  inspectedAt: string;
}

export interface InboundQualityCheckResult {
  inboundOrderId: number;
  items: QualityCheckItemDto[];
}

// ============== Barcode Scanning Types ==============

export interface BarcodeScanLineDto {
  productId: number;
  productName: string;
  sku: string;
  expectedQuantity: number;
  scannedQuantity: number;
  isComplete: boolean;
  isOverScanned: boolean;
}

export interface BarcodeScanSessionDto {
  sessionId: string;
  inboundOrderId: number;
  staffId: number;
  startedAt: string;
  isFinalized: boolean;
  finalizedAt?: string;
  lines: BarcodeScanLineDto[];
  allComplete: boolean;
}

export interface ScanBarcodeRequest {
  sku: string;
}

export interface ScanResultDto {
  success: boolean;
  warningMessage?: string;
  updatedLine: BarcodeScanLineDto;
  session: BarcodeScanSessionDto;
}

export interface BarcodeQcOverride {
  productId: number;
  receivedQuantity: number;
  passedQuantity: number;
  failureReason?: string;
  notes?: string;
}

export interface FinalizeBarcodeSessionRequest {
  qcOverrides?: BarcodeQcOverride[];
}

export interface StartBarcodeSessionRequest {
  staffId: number;
}

