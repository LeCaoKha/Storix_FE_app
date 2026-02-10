import {
    createOutboundRequisition,
    createRequisition,
    getOutboundRequisitionById,
    getOutboundRequisitions,
    getRequisitionById,
    getRequisitions
} from '@/services/requisition.api';
import { useAuthStore } from '@/stores/auth.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useRequisitions = (companyId: number | undefined) => {
    return useQuery({
        queryKey: ['requisitions', companyId],
        queryFn: () => getRequisitions(companyId!),
        enabled: !!companyId,
    });
};

export const useRequisition = (id: number | string | undefined) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['requisitions', user?.companyId, numericId],
        queryFn: async () => {
            if (!numericId || !user?.companyId) return null;

            // Try to fetch from inbound first
            const inbound = await getRequisitionById(user.companyId, numericId).catch(() => null);
            if (inbound) return inbound;

            // If not found in inbound, try outbound
            const outbound = await getOutboundRequisitionById(user.companyId, numericId).catch(() => null);
            return outbound;
        },
        enabled: !!numericId && !!user?.companyId,
    });
};

export const useCreateRequisition = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: (data: {
            warehouseId: number;
            supplierId: number;
            note?: string;
            expectedDate?: string;
            orderDiscount?: number;
            items: {
                productId: number;
                expectedQuantity: number;
                price?: number;
                lineDiscount?: number;
            }[];
        }) => createRequisition({
            ...data,
            note: data.note || '',
            expectedDate: data.expectedDate || new Date().toISOString(),
            items: data.items.map(item => ({
                ...item,
                price: item.price ?? 0,
                lineDiscount: item.lineDiscount ?? 0
            }))
        }, user?.id || 0),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requisitions'] });
        },
    });
};

export const useCreateOutboundRequisition = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: (data: {
            warehouseId: number;
            destination: string;
            items: { productId: number; quantity: number }[];
        }) => createOutboundRequisition(data, user?.id || 0),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requisitions'] });
            queryClient.invalidateQueries({ queryKey: ['outbound-requisitions'] });
        },
    });
};

export const useOutboundRequisitions = (companyId: number | undefined) => {
    return useQuery({
        queryKey: ['outbound-requisitions', companyId],
        queryFn: () => getOutboundRequisitions(companyId!),
        enabled: !!companyId,
    });
};

export const useOutboundRequisition = (id: number | string | undefined) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['outbound-requisitions', user?.companyId, numericId],
        queryFn: async () => {
            if (!numericId || !user?.companyId) return null;
            return getOutboundRequisitionById(user.companyId, numericId);
        },
        enabled: !!numericId && !!user?.companyId,
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

// Note: useUpdateInboundRequestStatus is now moved to inbound-orders.hooks.ts 
// to avoid duplication and ensure consistent invalidation.
export { useUpdateInboundRequestStatus, useUpdateOutboundRequestStatus } from './inbound-orders.hooks';


