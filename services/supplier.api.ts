import { CreateSupplierPayload, Supplier, UpdateSupplierPayload } from '@/types/supplier';
import { api } from './axios.instance';

/**
 * Get all suppliers
 */
export const getSuppliers = async (): Promise<Supplier[]> => {
  const response = await api.get<Supplier[]>('/api/Suppliers');
  return response.data;
};

/**
 * Get supplier by ID
 */
export const getSupplierById = async (supplierId: number): Promise<Supplier> => {
  const response = await api.get<Supplier>(`/api/Suppliers/${supplierId}`);
  return response.data;
};

/**
 * Create new supplier
 */
export const createSupplier = async (data: CreateSupplierPayload): Promise<Supplier> => {
  const response = await api.post<Supplier>('/api/Suppliers', data);
  return response.data;
};

/**
 * Update supplier
 */
export const updateSupplier = async (
  supplierId: number,
  data: UpdateSupplierPayload
): Promise<Supplier> => {
  const response = await api.put<Supplier>(`/api/Suppliers/${supplierId}`, data);
  return response.data;
};

/**
 * Delete supplier
 */
export const deleteSupplier = async (supplierId: number): Promise<void> => {
  await api.delete(`/api/Suppliers/${supplierId}`);
};
