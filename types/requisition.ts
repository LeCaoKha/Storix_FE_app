export type RequisitionType = 'inbound' | 'outbound';
// BE InboundRequest statuses: Pending, Approved, Rejected, Transported
// BE OutboundRequest statuses: Pending, Approved, Rejected
export type RequisitionStatus = 'pending' | 'approved' | 'rejected' | 'transported';

export interface GoodsRequisition {
  id: number;
  requisitionNumber: string;
  type: RequisitionType;
  status: RequisitionStatus;
  warehouseId: number;
  warehouse?: string;
  supplierId: number;
  supplier?: string;
  requestedBy: number;
  createdByName?: string;
  purpose: string;
  notes?: string;
  expectedDate: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  items: RequisitionItem[];

  // For details/review
  reviewedByName?: string;
  reviewedAt?: Date | string;
  rejectionReason?: string;
  linkedOrderId?: string;
  linkedOrderNumber?: string;
}

export interface RequisitionItem {
  id: number;
  sku: string;
  productName: string;
  quantity: number;
  unit: string;
  notes?: string;
  product?: import('./product').Product; // Full product data including prices
  // Metadata for inbound/outbound
  batchNumber?: string;
  lotNumber?: string;
  expiryDate?: Date | string;
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}