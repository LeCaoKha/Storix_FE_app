// Supplier types for warehouse management

export interface Supplier {
  supplierId?: number;
  id?: number; // Alternative ID field from some APIs
  supplierName?: string;
  name?: string; // Alternative name field from some APIs
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string | null;
  updatedAt: string | null;
  isActive?: boolean;
  status?: string;
  companyId?: number;
  company?: any;
  inboundOrders?: any[];
  inboundRequests?: any[];
}

export interface CreateSupplierPayload {
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export interface UpdateSupplierPayload {
  supplierName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}
