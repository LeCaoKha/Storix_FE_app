import { createRequisition, getRequisitions } from '@/services/requisition.api';
import { useAuthStore } from '@/stores/auth.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useRequisitions = () => {
    return useQuery({
        queryKey: ['requisitions'],
        queryFn: getRequisitions,
    });
};

export const useRequisition = (id: number | string | undefined) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

    return useQuery({
        queryKey: ['requisitions', numericId],
        queryFn: async () => {
            if (!numericId) return null;
            const all = await getRequisitions();
            return all.find((r) => r.id === numericId) || null;
        },
        enabled: !!numericId,
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

export const useLinkOrderToRequisition = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ requisitionId, orderId, orderNumber }: { requisitionId: number; orderId: string; orderNumber: string }) => {
            // This would normally be an API call. For now, we'll simulate success.
            // In a real app, you'd call a service here.
            console.log(`Linking order ${orderNumber} to requisition ${requisitionId}`);
            return { success: true };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['requisitions'] });
            queryClient.invalidateQueries({ queryKey: ['requisitions', variables.requisitionId] });
        },
    });
};


