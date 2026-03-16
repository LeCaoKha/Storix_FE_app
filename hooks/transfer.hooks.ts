import {
    addTransferOrderItem,
    approveTransferOrder,
    cancelTransferOrder,
    checkTransferAvailability,
    createTransferOrder,
    getTransferOrderById,
    getTransferOrders,
    markTransferPacked,
    receiveTransfer,
    rejectTransferOrder,
    removeTransferOrderItem,
    shipTransfer,
    startTransferPicking,
    submitTransferOrder,
    updateTransferOrder,
    updateTransferOrderItem
} from '@/services/transfer.api';
import { useAuthStore } from '@/stores/auth.store';
import {
    AddTransferOrderItemRequest,
    CancelTransferOrderRequest,
    CreateTransferOrderRequest,
    ReceiveTransferPayload,
    RejectTransferOrderRequest,
    UpdateTransferOrderItemRequest,
    UpdateTransferOrderRequest
} from '@/types/transfer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useTransferOrders = (params: { 
    sourceWarehouseId?: number; 
    destinationWarehouseId?: number; 
    status?: string; 
}, enabled = true) => {
    const companyId = useAuthStore((state) => state.user?.companyId);

    return useQuery({
        queryKey: ['transfer-orders', companyId, params],
        queryFn: () => getTransferOrders(params),
        enabled: enabled && !!companyId,
    });
};

export const useTransferOrder = (id: number) => {
    const companyId = useAuthStore((state) => state.user?.companyId);

    return useQuery({
        queryKey: ['transfer-order', companyId, id],
        queryFn: () => getTransferOrderById(id),
        enabled: !!id && !!companyId,
    });
};

export const useStartTransferPicking = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => startTransferPicking(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-order-availability'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

export const useMarkTransferPacked = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => markTransferPacked(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-order-availability'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

export const useShipTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => shipTransfer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-order-availability'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

export const useReceiveTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: ReceiveTransferPayload }) => 
            receiveTransfer(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-order-availability'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

// ==========================
// MANAGER HOOKS
// ==========================

export const useCheckTransferAvailability = (id: number) => {
    const companyId = useAuthStore((state) => state.user?.companyId);

    return useQuery({
        queryKey: ['transfer-order-availability', companyId, id],
        queryFn: () => checkTransferAvailability(id),
        enabled: !!id && !!companyId,
    });
};

export const useCreateTransferOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateTransferOrderRequest) => createTransferOrder(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-order-availability'] });
        },
    });
};

export const useUpdateTransferOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateTransferOrderRequest }) => 
            updateTransferOrder(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-order-availability'] });
        },
    });
};

export const useAddTransferOrderItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: AddTransferOrderItemRequest }) => 
            addTransferOrderItem(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-order-availability'] });
        },
    });
};

export const useUpdateTransferOrderItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, itemId, payload }: { id: number; itemId: number; payload: UpdateTransferOrderItemRequest }) => 
            updateTransferOrderItem(id, itemId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-order-availability'] });
        },
    });
};

export const useRemoveTransferOrderItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, itemId }: { id: number; itemId: number }) => 
            removeTransferOrderItem(id, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-order-availability'] });
        },
    });
};

export const useSubmitTransferOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => submitTransferOrder(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-order-availability'] });
        },
    });
};

export const useApproveTransferOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => approveTransferOrder(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-order-availability'] });
        },
    });
};

export const useRejectTransferOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: RejectTransferOrderRequest }) => 
            rejectTransferOrder(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-order-availability'] });
        },
    });
};

export const useCancelTransferOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload?: CancelTransferOrderRequest }) => 
            cancelTransferOrder(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transfer-order-availability'] });
        },
    });
};
