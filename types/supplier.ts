// Supplier types for warehouse management

export interface Supplier {
  supplierId: number;
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
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
