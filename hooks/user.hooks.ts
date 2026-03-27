import { getUserProfile, getUsersByWarehouse, updateProfile } from '@/services/user.api';
import { useAuthStore } from '@/stores/auth.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const userKeys = {
    all: ['users'] as const,
    profiles: () => [...userKeys.all, 'profile'] as const,
    profile: (id: number) => [...userKeys.profiles(), id] as const,
    byWarehouse: (warehouseId: number) => [...userKeys.all, 'warehouse', warehouseId] as const,
};

export const useProfile = (userId?: number) => {
    const { user } = useAuthStore();
    const id = userId || user?.id;

    return useQuery({
        queryKey: userKeys.profile(id || 0),
        queryFn: () => getUserProfile(id!),
        enabled: !!id,
    });
};

export const useWarehouseStaff = (warehouseId?: number, companyId?: number) => {
    return useQuery({
        queryKey: userKeys.byWarehouse(warehouseId || 0),
        queryFn: () => getUsersByWarehouse(warehouseId!),
        enabled: !!warehouseId,
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: ({ userId, formData }: { userId: number; formData: FormData }) =>
            updateProfile(userId, formData),
        onSuccess: (updatedUser) => {
            queryClient.invalidateQueries({ queryKey: userKeys.profile(updatedUser.id) });
            // Optionally update auth store if you want to keep it in sync
        },
    });
};
