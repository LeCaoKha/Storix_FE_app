import {
    createSupplier,
    deleteSupplier,
    getSupplierById,
    getSuppliers,
    updateSupplier,
} from '@/services/supplier.api';
import { useAuthStore } from '@/stores/auth.store';
import { CreateSupplierPayload, UpdateSupplierPayload } from '@/types/supplier';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query keys
export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...supplierKeys.lists(), filters] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: number) => [...supplierKeys.details(), id] as const,
};

/**
 * Hook to fetch all suppliers
 */
export const useSuppliers = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [...supplierKeys.lists(), userId],
    queryFn: () => getSuppliers(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a single supplier by ID
 */
export const useSupplier = (supplierId: number) => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: supplierKeys.detail(supplierId),
    queryFn: () => getSupplierById(userId!, supplierId),
    enabled: !!userId && !!supplierId,
  });
};

/**
 * Hook to create a new supplier
 */
export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierPayload) => createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
};

/**
 * Hook to update a supplier
 */
export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ supplierId, data }: { supplierId: number; data: UpdateSupplierPayload }) =>
      updateSupplier(supplierId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.supplierId) });
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
};

/**
 * Hook to delete a supplier
 */
export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (supplierId: number) => deleteSupplier(userId!, supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
};
