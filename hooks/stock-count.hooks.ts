import {
    getStockCountTicketById,
    getStockCountTickets,
    updateStockCountItem,
    UpdateStockCountItemPayload
} from '@/services/stock-count.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const stockCountKeys = {
    all: ['stock-count'] as const,
    tickets: () => [...stockCountKeys.all, 'tickets'] as const,
    ticket: (id: number) => [...stockCountKeys.tickets(), id] as const,
};

export const useStockCountTickets = (companyId: number, warehouseId?: number, status?: string) => {
    return useQuery({
        queryKey: [...stockCountKeys.tickets(), { warehouseId, status }],
        queryFn: () => getStockCountTickets(companyId, warehouseId, status),
        enabled: !!companyId,
    });
};

export const useStockCountTicket = (ticketId: number) => {
    return useQuery({
        queryKey: stockCountKeys.ticket(ticketId),
        queryFn: () => getStockCountTicketById(ticketId),
        enabled: !!ticketId,
    });
};

export const useUpdateStockCountItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ itemId, payload }: { itemId: number; payload: UpdateStockCountItemPayload }) =>
            updateStockCountItem(itemId, payload),
        onSuccess: (_, variables) => {
            // Invalidate specific ticket query to refresh data
            // Note: We don't have the ticketId here, but we can invalidate all tickets or use a broader key
            queryClient.invalidateQueries({ queryKey: stockCountKeys.tickets() });
        },
    });
};
