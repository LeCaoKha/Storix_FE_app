export type InboundStatus = 'scheduled' | 'arrived' | 'receiving' | 'putaway' | 'completed' | 'cancelled' | 'pending' | 'received' | 'in_transit';

export interface InboundOrder {
  id: string;
  inboundNumber: string;
  requisitionId?: string;
  requisitionNumber?: string;
  supplier: string;
  supplierContact?: string;
  poReference?: string;
  status: InboundStatus;
  warehouse: string;
  items: InboundOrderItem[];
  expectedArrivalDate: Date | string;
  actualArrivalDate?: Date | string;
  createdBy: string;
  createdByName: string;
  notes?: string;
  createdAt: Date | string;
}

export interface InboundOrderItem {
  id: string;
  sku: string;
  productName: string;
  expectedQty: number;
  receivedQty: number;
  unit: string;
  batchNumber?: string;
  lotNumber?: string;
  expiryDate?: Date | string;
  qc?: 'good' | 'damaged' | 'returned';
  condition?: 'good' | 'damaged' | 'returned';
  // Backward compatibility or other versions
  productId?: string;
  productCode?: string;
  price?: number;
}