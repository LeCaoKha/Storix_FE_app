export type OutboundStatus = 'open' | 'picking' | 'packing' | 'ready' | 'shipped' | 'completed' | 'delivered' | 'cancelled' | 'on_hold';

export interface OutboundOrder {
  id: string;
  outboundNumber: string;
  requisitionId?: string;
  requisitionNumber?: string;
  customer: string;
  customerContact?: string;
  destination: string;
  salesOrderRef?: string;
  status: OutboundStatus;
  warehouse: string;
  items: OutboundOrderItem[];
  optimizedRoute: string[];
  expectedShipDate: Date | string;
  actualShipDate?: Date | string;
  createdBy: string;
  createdByName: string;
  notes?: string;
  carrier?: string;
  trackingNumber?: string;
  createdAt: Date | string;
}

export interface OutboundOrderItem {
  id: string;
  sku: string;
  productName: string;
  qtyToPick: number;
  qtyPicked: number;
  unit: string;
  pickLocations: {
    locationId: string;
    locationCode: string;
    quantity: number;
    sequence: number;
  }[];
  batchNumber?: string;
  lotNumber?: string;
  serialNumbers?: string[];
  // Backward compatibility
  productId?: string;
  productCode?: string;
  price?: number;
}