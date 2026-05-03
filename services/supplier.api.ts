import { CreateSupplierPayload, Supplier, UpdateSupplierPayload } from '@/types/supplier';
import { api } from './axios.instance';

/**
 * Get all suppliers
 * @param userId - ID của user hiện tại để lấy danh sách suppliers
 */
export const getSuppliers = async (userId: number): Promise<Supplier[]> => {
  const response = await api.get<Supplier[]>(`/api/Suppliers/get-all/${userId}`);
  return response.data;
};

/**
 * Get supplier by ID
 * @param userId - ID của user hiện tại
 * @param supplierId - ID của supplier cần lấy
 */
export const getSupplierById = async (userId: number, supplierId: number): Promise<Supplier> => {
  const response = await api.get<Supplier>(`/api/Suppliers/get-by-id/${userId}/${supplierId}`);
  return response.data;
};

/**
 * Create new supplier
 */
export const createSupplier = async (data: CreateSupplierPayload): Promise<Supplier> => {
  const response = await api.post<Supplier>('/api/Suppliers/add-new-supplier', data);
  return response.data;
};

/**
 * Update supplier
 */
export const updateSupplier = async (
  supplierId: number,
  data: UpdateSupplierPayload
): Promise<Supplier> => {
  const response = await api.put<Supplier>(`/api/Suppliers/update-a-supplier/${supplierId}`, data);
  return response.data;
};

/**
 * Delete supplier
 * BE requires userId to resolve companyId for authorization
 */
export const deleteSupplier = async (userId: number, supplierId: number): Promise<void> => {
  await api.delete(`/api/Suppliers/delete-a-supplier/${userId}/${supplierId}`);
};
