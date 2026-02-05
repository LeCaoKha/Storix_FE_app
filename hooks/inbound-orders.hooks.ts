import { api } from '@/services/axios.instance';
import {
  createInboundRequest,
  createInboundTicket,
  updateInboundRequestStatus,
  updateInboundTicketItems,
  type InboundOrder as ApiInboundOrder,
  type CreateInboundRequestPayload,
  type UpdateInboundItemPayload,
} from '@/services/inbound-order.api';
import { InboundRequest } from '@/types/inbound-order';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ============== Query Keys ==============
export const inboundOrderKeys = {
  all: ['inbound-orders'] as const,
  // For requests (pending approval)
  requests: () => [...inboundOrderKeys.all, 'requests'] as const,
  requestList: (filters: Record<string, unknown>) => [...inboundOrderKeys.requests(), filters] as const,
  requestDetail: (id: number) => [...inboundOrderKeys.requests(), 'detail', id] as const,
  // For tickets (approved and processing)
  tickets: () => [...inboundOrderKeys.all, 'tickets'] as const,
  ticketList: (filters: Record<string, unknown>) => [...inboundOrderKeys.tickets(), filters] as const,
  ticketDetail: (id: number) => [...inboundOrderKeys.tickets(), 'detail', id] as const,
  // Legacy keys for backward compatibility
  lists: () => [...inboundOrderKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...inboundOrderKeys.lists(), filters] as const,
  details: () => [...inboundOrderKeys.all, 'detail'] as const,
  detail: (id: number) => [...inboundOrderKeys.details(), id] as const,
};

// ============== API Functions ==============

/**
 * Lấy danh sách yêu cầu nhập kho (requests - chờ duyệt)
 */
const getInboundRequests = async (): Promise<InboundRequest[]> => {
  try {
    const response = await api.get('/api/InventoryInbound/get-all-inbound-requests');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn('Inbound requests endpoint not implemented yet');
      return [];
    }
    console.error('Error fetching inbound requests:', error);
    return [];
  }
};

/**
 * Lấy chi tiết yêu cầu nhập kho
 */
const getInboundRequestById = async (id: number): Promise<InboundRequest | null> => {
  try {
    const response = await api.get(`/api/InventoryInbound/get-inbound-request-by-id/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching inbound request ${id}:`, error);
    return null;
  }
};

/**
 * Lấy danh sách phiếu nhập kho (tickets - đã duyệt)
 */
const getInboundTickets = async (): Promise<ApiInboundOrder[]> => {
  try {
    const response = await api.get('/api/InventoryInbound/get-all-inbound-tickets');
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      console.warn('⚠️ API endpoint /get-all-inbound-tickets not implemented yet');
    } else {
      console.error('Error fetching inbound tickets:', error);
    }
    return [];
  }
};

/**
 * Lấy chi tiết phiếu nhập kho
 */
const getInboundTicketById = async (id: number): Promise<ApiInboundOrder | null> => {
  try {
    const response = await api.get(`/api/InventoryInbound/get-inbound-ticket-by-id/${id}`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      console.warn(`⚠️ Ticket ${id} not found or API not implemented`);
    } else {
      console.error(`Error fetching inbound ticket ${id}:`, error);
    }
    return null;
  }
};

// ============== Hooks ==============

/**
 * Hook lấy danh sách yêu cầu nhập kho (chờ duyệt - cho Manager)
 */
export const useInboundRequests = () => {
  return useQuery({
    queryKey: inboundOrderKeys.requests(),
    queryFn: getInboundRequests,
  });
};

/**
 * Hook lấy chi tiết yêu cầu nhập kho
 */
export const useInboundRequest = (id: number | string | undefined) => {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

  return useQuery({
    queryKey: inboundOrderKeys.requestDetail(numericId ?? 0),
    queryFn: () => getInboundRequestById(numericId!),
    enabled: !!numericId && !isNaN(numericId),
  });
};

/**
 * Hook lấy danh sách phiếu nhập kho (đã duyệt - cho Staff xử lý)
 */
export const useInboundTickets = () => {
  return useQuery({
    queryKey: inboundOrderKeys.tickets(),
    queryFn: getInboundTickets,
  });
};

/**
 * Hook lấy chi tiết phiếu nhập kho
 */
export const useInboundTicket = (id: number | string | undefined) => {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

  return useQuery({
    queryKey: inboundOrderKeys.ticketDetail(numericId ?? 0),
    queryFn: () => getInboundTicketById(numericId!),
    enabled: !!numericId && !isNaN(numericId),
  });
};

/**
 * Hook lấy danh sách phiếu nhập kho (legacy - backward compatibility)
 * @deprecated Use useInboundTickets or useInboundRequests instead
 */
export const useInboundOrders = () => {
  return useQuery({
    queryKey: inboundOrderKeys.lists(),
    queryFn: getInboundTickets,
  });
};

/**
 * Hook lấy chi tiết phiếu nhập kho (legacy - backward compatibility)
 * @deprecated Use useInboundTicket or useInboundRequest instead
 */
export const useInboundOrder = (id: number | string | undefined) => {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

  return useQuery({
    queryKey: inboundOrderKeys.detail(numericId ?? 0),
    queryFn: () => getInboundTicketById(numericId!),
    enabled: !!numericId && !isNaN(numericId),
  });
};

/**
 * Hook tạo yêu cầu nhập kho mới
 */
export const useCreateInboundRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInboundRequestPayload) => createInboundRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboundOrderKeys.all });
    },
  });
};

/**
 * Hook cập nhật trạng thái yêu cầu nhập kho (approve/reject)
 */
export const useUpdateInboundRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      approverId,
      status,
    }: {
      requestId: number;
      approverId: number;
      status: 'Approved' | 'Rejected';
    }) => updateInboundRequestStatus(requestId, approverId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboundOrderKeys.all });
    },
  });
};

/**
 * Hook tạo phiếu nhập từ yêu cầu đã duyệt
 */
export const useCreateInboundTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, createdBy }: { requestId: number; createdBy: number }) =>
      createInboundTicket(requestId, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboundOrderKeys.all });
    },
  });
};

/**
 * Hook cập nhật số lượng đã nhận (Staff sử dụng khi nhận hàng)
 */
export const useUpdateInboundTicketItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, items }: { ticketId: number; items: UpdateInboundItemPayload[] }) =>
      updateInboundTicketItems(ticketId, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inboundOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: inboundOrderKeys.detail(variables.ticketId) });
    },
  });
};