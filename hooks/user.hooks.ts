import { getUserById, getUsersByWarehouse } from '@/services/user.api';
import { useQuery } from '@tanstack/react-query';

export const useUserById = (userId: number | null | undefined, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['user', userId],
        queryFn: () => getUserById(userId!),
        enabled: enabled && !!userId,
    });
};

export const useWarehouseStaff = (warehouseId: number | null | undefined, companyId?: number) => {
    return useQuery({
        queryKey: ['warehouse-staff', warehouseId, companyId],
        queryFn: async () => {
            if (!warehouseId) return [];
            const users = await getUsersByWarehouse(warehouseId);
            // Filter only Staff (roleId = 4) from the same company
            return users.filter(u =>
                u.roleId === 4 &&
                (!companyId || u.companyId === companyId)
            );
        },
        enabled: !!warehouseId,
    });
};
