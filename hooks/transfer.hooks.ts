import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    getTransferOrderById, 
    getTransferOrders, 
    markTransferPacked, 
    receiveTransfer, 
    shipTransfer, 
    startTransferPicking,
    checkTransferAvailability,
    createTransferOrder,
    updateTransferOrder,
    addTransferOrderItem,
    updateTransferOrderItem,
    removeTransferOrderItem,
    submitTransferOrder,
    approveTransferOrder,
    rejectTransferOrder,
    cancelTransferOrder
} from '@/services/transfer.api';
import { 
    ReceiveTransferPayload,
    CreateTransferOrderRequest,
    UpdateTransferOrderRequest,
    AddTransferOrderItemRequest,
    UpdateTransferOrderItemRequest,
    RejectTransferOrderRequest,
    CancelTransferOrderRequest
} from '@/types/transfer';

export const useTransferOrders = (params: { 
    sourceWarehouseId?: number; 
    destinationWarehouseId?: number; 
    status?: string; 
}) => {
    return useQuery({
        queryKey: ['transfer-orders', params],
        queryFn: () => getTransferOrders(params),
    });
};

export const useTransferOrder = (id: number) => {
    return useQuery({
        queryKey: ['transfer-order', id],
        queryFn: () => getTransferOrderById(id),
        enabled: !!id,
    });
};

export const useStartTransferPicking = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => startTransferPicking(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

export const useMarkTransferPacked = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => markTransferPacked(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

export const useShipTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => shipTransfer(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

export const useReceiveTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: ReceiveTransferPayload }) => 
            receiveTransfer(id, payload),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

// ==========================
// MANAGER HOOKS
// ==========================

export const useCheckTransferAvailability = (id: number) => {
    return useQuery({
        queryKey: ['transfer-order-availability', id],
        queryFn: () => checkTransferAvailability(id),
        enabled: !!id,
    });
};

export const useCreateTransferOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateTransferOrderRequest) => createTransferOrder(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
        },
    });
};

export const useUpdateTransferOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateTransferOrderRequest }) => 
            updateTransferOrder(id, payload),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
        },
    });
};

export const useAddTransferOrderItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: AddTransferOrderItemRequest }) => 
            addTransferOrderItem(id, payload),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
        },
    });
};

export const useUpdateTransferOrderItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, itemId, payload }: { id: number; itemId: number; payload: UpdateTransferOrderItemRequest }) => 
            updateTransferOrderItem(id, itemId, payload),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
        },
    });
};

export const useRemoveTransferOrderItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, itemId }: { id: number; itemId: number }) => 
            removeTransferOrderItem(id, itemId),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
        },
    });
};

export const useSubmitTransferOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => submitTransferOrder(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
        },
    });
};

export const useApproveTransferOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => approveTransferOrder(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
        },
    });
};

export const useRejectTransferOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: RejectTransferOrderRequest }) => 
            rejectTransferOrder(id, payload),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
        },
    });
};

export const useCancelTransferOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload?: CancelTransferOrderRequest }) => 
            cancelTransferOrder(id, payload),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
            queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
        },
    });
};
