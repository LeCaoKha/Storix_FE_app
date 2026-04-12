import { getUserById, getUserProfile, mergeUserProfileIntoUser } from '@/services/user.api';
import { getAccessibleWarehouses, getWarehouseStructure } from '@/services/warehouse.api';
import { useAuthStore } from '@/stores';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook lấy danh sách warehouses
 */
export const useWarehouses = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const companyId = user?.companyId;
  const roleId = user?.roleId;
  const staffId = user?.id;
  const assignedWarehouseIds = user?.warehouseAssignments?.map((assignment) => assignment.warehouseId) || [];

  console.log('[useWarehouses] input', {
    userId: user?.id,
    companyId,
    roleId,
    staffId,
    warehouseId: user?.warehouseId,
    warehouseName: user?.warehouseName,
    assignedWarehouseIds,
  });

  return useQuery({
    queryKey: ['warehouses', companyId, roleId, staffId, user?.warehouseId, assignedWarehouseIds],
    queryFn: async () => {
      let resolvedUser = user;

      if (
        resolvedUser?.id &&
        resolvedUser.roleId !== 2 &&
        !resolvedUser.warehouseId &&
        (!resolvedUser.warehouseAssignments || resolvedUser.warehouseAssignments.length === 0)
      ) {
        console.log('[useWarehouses] refreshing profile because persisted session has no warehouse info', {
          userId: resolvedUser.id,
          roleId: resolvedUser.roleId,
        });

        try {
          const [freshUserSummary, freshProfile] = await Promise.allSettled([
            getUserById(resolvedUser.id),
            getUserProfile(resolvedUser.id),
          ]);

          resolvedUser = mergeUserProfileIntoUser(resolvedUser, {
            ...(freshUserSummary.status === 'fulfilled' ? freshUserSummary.value : {}),
            ...(freshProfile.status === 'fulfilled' ? freshProfile.value : {}),
          });
          setUser(resolvedUser);

          console.log('[useWarehouses] refreshed profile', {
            warehouseId: resolvedUser.warehouseId,
            assignedWarehouseIds: resolvedUser.warehouseAssignments?.map((assignment) => assignment.warehouseId) || [],
          });
        } catch (error) {
          console.warn('[useWarehouses] failed to refresh profile', error);
        }
      }

      const result = await getAccessibleWarehouses(resolvedUser!.companyId!, resolvedUser!.roleId, resolvedUser!.id, {
        id: resolvedUser?.warehouseId,
        name: resolvedUser?.warehouseName,
      }, resolvedUser?.warehouseAssignments);

      console.log('[useWarehouses] result', {
        count: result.length,
        warehouses: result.map((warehouse) => ({ id: warehouse.id, name: warehouse.name })),
      });

      return result;
    },
    enabled: !!companyId && !!roleId,
  });
};

/**
 * Hook lấy cấu trúc warehouse layout
 */
export const useWarehouseStructure = (warehouseId?: number) => {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.companyId;
  const normalizedWarehouseId = Number(warehouseId);
  const canFetchStructure =
    typeof companyId === 'number' &&
    companyId > 0 &&
    Number.isFinite(normalizedWarehouseId) &&
    normalizedWarehouseId > 0;

  return useQuery({
    queryKey: ['warehouse-structure', companyId, normalizedWarehouseId],
    queryFn: () => getWarehouseStructure(companyId!, normalizedWarehouseId),
    enabled: canFetchStructure,
    staleTime: 5 * 60 * 1000, // Cache 5 phút vì warehouse structure ít thay đổi
  });
};
