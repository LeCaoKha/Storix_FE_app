import { api } from '@/services/axios.instance';
import {
  confirmOutboundOrder,
  createOutboundRequest,
  createOutboundTicket,
  getInventoryAvailability,
  updateOutboundRequestStatus,
  updateOutboundTicketItems,
  updateOutboundTicketStatus,
  type OutboundOrder as ApiOutboundOrder,
  type CreateOutboundRequestPayload,
  type UpdateOutboundItemPayload,
} from '@/services/outbound-order.api';
import { OutboundRequest } from '@/types/outbound-order';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ============== Query Keys ==============
export const outboundOrderKeys = {
  all: ['outbound-orders'] as const,
  // For requests (pending approval)
  requests: () => [...outboundOrderKeys.all, 'requests'] as const,
  requestList: (filters: Record<string, unknown>) => [...outboundOrderKeys.requests(), filters] as const,
  requestDetail: (id: number) => [...outboundOrderKeys.requests(), 'detail', id] as const,
  // For tickets (approved and processing)
  tickets: () => [...outboundOrderKeys.all, 'tickets'] as const,
  ticketList: (filters: Record<string, unknown>) => [...outboundOrderKeys.tickets(), filters] as const,
  ticketDetail: (id: number) => [...outboundOrderKeys.tickets(), 'detail', id] as const,
  // Legacy keys for backward compatibility
  lists: () => [...outboundOrderKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...outboundOrderKeys.lists(), filters] as const,
  details: () => [...outboundOrderKeys.all, 'detail'] as const,
  detail: (id: number) => [...outboundOrderKeys.details(), id] as const,
  availability: (warehouseId: number, productIds: number[]) =>
    [...outboundOrderKeys.all, 'availability', warehouseId, productIds] as const,
};

// ============== API Functions ==============

/**
 * Lấy danh sách yêu cầu xuất kho (requests - chờ duyệt)
 */
const getOutboundRequests = async (): Promise<OutboundRequest[]> => {
  try {
    const response = await api.get('/api/InventoryOutbound/get-all-outbound-requests');
    return response.data;
  } catch {
    console.warn('Outbound requests API not available, returning empty array');
    return [];
  }
};

/**
 * Lấy chi tiết yêu cầu xuất kho
 */
const getOutboundRequestById = async (id: number): Promise<OutboundRequest | null> => {
  try {
    const response = await api.get(`/api/InventoryOutbound/get-outbound-request-by-id/${id}`);
    return response.data;
  } catch {
    console.warn(`Outbound request ${id} not found`);
    return null;
  }
};

/**
 * Lấy danh sách phiếu xuất kho (tickets - đã duyệt)
 */
const getOutboundTickets = async (): Promise<ApiOutboundOrder[]> => {
  try {
    const response = await api.get('/api/InventoryOutbound/get-all-outbound-tickets');
    return response.data;
  } catch {
    console.warn('Outbound tickets API not available, returning empty array');
    return [];
  }
};

/**
 * Lấy chi tiết phiếu xuất kho
 */
const getOutboundTicketById = async (id: number): Promise<ApiOutboundOrder | null> => {
  try {
    const response = await api.get(`/api/InventoryOutbound/get-outbound-ticket-by-id/${id}`);
    return response.data;
  } catch {
    console.warn(`Outbound ticket ${id} not found`);
    return null;
  }
};

// ============== Hooks ==============

/**
 * Hook lấy danh sách yêu cầu xuất kho (chờ duyệt - cho Manager/Admin)
 */
export const useOutboundRequests = () => {
  return useQuery({
    queryKey: outboundOrderKeys.requests(),
    queryFn: getOutboundRequests,
  });
};

/**
 * Hook lấy chi tiết yêu cầu xuất kho
 */
export const useOutboundRequest = (id: number | string | undefined) => {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

  return useQuery({
    queryKey: outboundOrderKeys.requestDetail(numericId ?? 0),
    queryFn: () => getOutboundRequestById(numericId!),
    enabled: !!numericId && !isNaN(numericId),
  });
};

/**
 * Hook lấy danh sách phiếu xuất kho (đã duyệt - cho Staff xử lý)
 */
export const useOutboundTickets = () => {
  return useQuery({
    queryKey: outboundOrderKeys.tickets(),
    queryFn: getOutboundTickets,
  });
};

/**
 * Hook lấy chi tiết phiếu xuất kho
 */
export const useOutboundTicket = (id: number | string | undefined) => {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

  return useQuery({
    queryKey: outboundOrderKeys.ticketDetail(numericId ?? 0),
    queryFn: () => getOutboundTicketById(numericId!),
    enabled: !!numericId && !isNaN(numericId),
  });
};

/**
 * Hook lấy danh sách phiếu xuất kho (legacy - backward compatibility)
 * @deprecated Use useOutboundTickets or useOutboundRequests instead
 */
export const useOutboundOrders = () => {
  return useQuery({
    queryKey: outboundOrderKeys.lists(),
    queryFn: getOutboundTickets,
  });
};

/**
 * Hook lấy chi tiết phiếu xuất kho (legacy - backward compatibility)
 * @deprecated Use useOutboundTicket or useOutboundRequest instead
 */
export const useOutboundOrder = (id: number | string | undefined) => {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

  return useQuery({
    queryKey: outboundOrderKeys.detail(numericId ?? 0),
    queryFn: () => getOutboundTicketById(numericId!),
    enabled: !!numericId && !isNaN(numericId),
  });
};

/**
 * Hook kiểm tra tồn kho (Manager)
 */
export const useInventoryAvailability = (warehouseId: number, productIds: number[]) => {
  return useQuery({
    queryKey: outboundOrderKeys.availability(warehouseId, productIds),
    queryFn: () => getInventoryAvailability(warehouseId, productIds),
    enabled: warehouseId > 0 && productIds.length > 0,
  });
};

/**
 * Hook tạo yêu cầu xuất kho mới (Manager)
 */
export const useCreateOutboundRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOutboundRequestPayload) => createOutboundRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: outboundOrderKeys.all });
    },
  });
};

/**
 * Hook cập nhật trạng thái yêu cầu xuất kho (Admin approve/reject)
 */
export const useUpdateOutboundRequestStatus = () => {
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
    }) => updateOutboundRequestStatus(requestId, approverId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: outboundOrderKeys.all });
    },
  });
};

/**
 * Hook tạo phiếu xuất từ yêu cầu đã duyệt (Manager)
 */
export const useCreateOutboundTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      createdBy,
      staffId,
      note,
    }: {
      requestId: number;
      createdBy: number;
      staffId?: number;
      note?: string;
    }) => createOutboundTicket(requestId, createdBy, staffId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: outboundOrderKeys.all });
    },
  });
};

/**
 * Hook cập nhật số lượng items (Staff khi lấy hàng)
 */
export const useUpdateOutboundTicketItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, items }: { ticketId: number; items: UpdateOutboundItemPayload[] }) =>
      updateOutboundTicketItems(ticketId, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: outboundOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: outboundOrderKeys.detail(variables.ticketId) });
    },
  });
};

/**
 * Hook cập nhật trạng thái phiếu xuất (Staff)
 */
export const useUpdateOutboundTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      performedBy,
      status,
    }: {
      ticketId: number;
      performedBy: number;
      status: string;
    }) => updateOutboundTicketStatus(ticketId, performedBy, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: outboundOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: outboundOrderKeys.detail(variables.ticketId) });
    },
  });
};

/**
 * Hook xác nhận hoàn thành phiếu xuất (Manager)
 */
export const useConfirmOutboundOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, performedBy }: { ticketId: number; performedBy: number }) =>
      confirmOutboundOrder(ticketId, performedBy),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: outboundOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: outboundOrderKeys.detail(variables.ticketId) });
    },
  });
};