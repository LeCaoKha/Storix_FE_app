import {
    getStockCountTicketById,
    getStockCountTickets,
    getStockCountTicketsByStaff,
    getWarehouseInventory,
    updateStockCountTicketItems,
    createStockCountTicket,
    cancelStockCountTicket
} from '@/services/stock-count.api';
import { useAuthStore } from '@/stores/auth.store';
import { UpdateStockCountItemPayload } from '@/types/stock-count';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const stockCountKeys = {
    all: ['stock-count'] as const,
    tickets: () => [...stockCountKeys.all, 'tickets'] as const,
    ticket: (id: number) => [...stockCountKeys.tickets(), id] as const,
};

export const useStockCountTickets = (companyId: number, warehouseId?: number, status?: string) => {
    return useQuery({
        queryKey: [...stockCountKeys.tickets(), companyId, { warehouseId, status }],
        queryFn: () => getStockCountTickets(companyId, warehouseId, status),
        enabled: !!companyId,
    });
};

export const useStockCountTicketsByStaff = () => {
    const { user } = useAuthStore();
    const companyId = user?.companyId ?? 0;
    const staffId = user?.id ?? 0;

    return useQuery({
        queryKey: [...stockCountKeys.tickets(), 'staff', companyId, staffId],
        queryFn: () => getStockCountTicketsByStaff(companyId, staffId),
        enabled: !!companyId && !!staffId,
        staleTime: 0,
    });
};

export const useStockCountTicket = (ticketId: number, companyId?: number) => {
    const { user } = useAuthStore();
    const resolvedCompanyId = companyId ?? user?.companyId ?? 0;

    return useQuery({
        queryKey: [...stockCountKeys.ticket(ticketId), resolvedCompanyId],
        queryFn: () => getStockCountTicketById(resolvedCompanyId, ticketId),
        enabled: !!ticketId && !!resolvedCompanyId,
        staleTime: 0,
    });
};

export const useWarehouseInventory = (warehouseId?: number, productIds?: number[]) => {
    const { user } = useAuthStore();
    const companyId = user?.companyId ?? 0;

    return useQuery({
        queryKey: ['warehouse-inventory', companyId, warehouseId, productIds],
        queryFn: () => getWarehouseInventory(companyId, warehouseId!, productIds),
        enabled: !!companyId && !!warehouseId && !!productIds && productIds.length > 0,
        staleTime: 0,
    });
};

export const useUpdateStockCountItem = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: ({
            ticketId,
            itemId,
            performedBy,
            payload,
        }: {
            ticketId: number;
            itemId: number;
            performedBy?: number;
            payload: UpdateStockCountItemPayload;
        }) =>
            updateStockCountTicketItems(ticketId, {
                performedBy: performedBy ?? user?.id ?? 0,
                items: [
                    {
                        stockCountItemId: itemId,
                        productId: payload.productId,
                        countedQuantity: payload.countedQuantity,
                        binId: payload.locationId?.toString() ?? null,
                    },
                ],
            }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: stockCountKeys.tickets() });
            queryClient.invalidateQueries({ queryKey: stockCountKeys.ticket(variables.ticketId) });
        },
    });
};

export const useCreateStockCountTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createStockCountTicket,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: stockCountKeys.tickets() });
        },
    });
};

export const useCancelStockCountTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: cancelStockCountTicket,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: stockCountKeys.tickets() });
        },
    });
};
