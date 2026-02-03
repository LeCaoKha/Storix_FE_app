import { useAuthStore } from '@/stores/auth.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRequisition, getRequisitions } from './requisition.api';

export const useRequisitions = () => {
    return useQuery({
        queryKey: ['requisitions'],
        queryFn: getRequisitions,
    });
};

export const useRequisition = (id: number) => {
    return useQuery({
        queryKey: ['requisitions', id],
        queryFn: async () => {
            const all = await getRequisitions();
            return all.find((r) => r.id === id);
        },
    });
};

export const useCreateRequisition = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: (data: {
            warehouseId: number;
            supplierId: number;
            items: { productId: number; expectedQuantity: number }[];
        }) => createRequisition(data, user?.id || 0),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requisitions'] });
        },
    });
};

