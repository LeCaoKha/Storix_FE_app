import { getAccessibleWarehouses, getWarehouseStructure } from '@/services/warehouse.api';
import { useAuthStore } from '@/stores';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook lấy danh sách warehouses
 */
export const useWarehouses = () => {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.companyId;
  const roleId = user?.roleId;
  const staffId = user?.id;

  return useQuery({
    queryKey: ['warehouses', companyId, roleId, staffId, user?.warehouseId],
    queryFn: () =>
      getAccessibleWarehouses(companyId!, roleId!, staffId, {
        id: user?.warehouseId,
        name: user?.warehouseName,
      }),
    enabled: !!companyId && !!roleId,
  });
};

/**
 * Hook lấy cấu trúc warehouse layout
 */
export const useWarehouseStructure = (warehouseId?: number) => {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.companyId;

  return useQuery({
    queryKey: ['warehouse-structure', companyId, warehouseId],
    queryFn: () => getWarehouseStructure(companyId!, warehouseId!),
    enabled: !!companyId && !!warehouseId,
    staleTime: 5 * 60 * 1000, // Cache 5 phút vì warehouse structure ít thay đổi
  });
};
