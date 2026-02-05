import type {
    CreateOutboundRequestPayload,
    InventoryAvailability,
    OutboundOrder,
    UpdateOutboundItemPayload,
} from '@/types/outbound-order';
import { api } from './axios.instance';

// Re-export types để tiện sử dụng
export type {
    ConfirmOutboundPayload, CreateOutboundRequestPayload, CreateOutboundTicketPayload, InventoryAvailability, OutboundOrder,
    OutboundOrderItem,
    OutboundRequest, UpdateOutboundItemPayload, UpdateOutboundRequestStatusPayload, UpdateOutboundStatusPayload
} from '@/types/outbound-order';

// ============== API Functions ==============

/**
 * Tạo yêu cầu xuất kho mới (Manager only)
 */
export const createOutboundRequest = async (payload: CreateOutboundRequestPayload) => {
  const res = await api.post('/api/InventoryOutbound/create-outbound-request', payload);
  return res.data;
};

/**
 * Kiểm tra số lượng tồn kho có sẵn (Manager only)
 */
export const getInventoryAvailability = async (
  warehouseId: number,
  productIds: number[]
): Promise<InventoryAvailability[]> => {
  const params = new URLSearchParams();
  params.append('warehouseId', warehouseId.toString());
  productIds.forEach((id) => params.append('productIds', id.toString()));

  const res = await api.get(`/api/InventoryOutbound/availability?${params.toString()}`);
  return res.data;
};

/**
 * Cập nhật trạng thái yêu cầu xuất kho (Admin approve/reject)
 */
export const updateOutboundRequestStatus = async (
  requestId: number,
  approverId: number,
  status: 'Approved' | 'Rejected'
) => {
  const res = await api.put(`/api/InventoryOutbound/update-outbound-request/${requestId}/status`, {
    approverId,
    status,
  });
  return res.data;
};

/**
 * Tạo phiếu xuất (ticket) từ yêu cầu đã duyệt (Manager only)
 */
export const createOutboundTicket = async (
  requestId: number,
  createdBy: number,
  staffId?: number,
  note?: string
) => {
  const res = await api.post(`/api/InventoryOutbound/create-outbound-ticket/${requestId}/tickets`, {
    createdBy,
    staffId,
    note,
  });
  return res.data as OutboundOrder;
};

/**
 * Cập nhật số lượng cho các items trong phiếu xuất (Staff only)
 * Staff sử dụng API này khi lấy hàng
 */
export const updateOutboundTicketItems = async (
  ticketId: number,
  items: UpdateOutboundItemPayload[]
) => {
  const res = await api.put(`/api/InventoryOutbound/tickets/${ticketId}/items`, items);
  return res.data as OutboundOrder;
};

/**
 * Cập nhật trạng thái phiếu xuất (Staff only)
 * Status: 'Picking' | 'Packed' | 'Ready'
 */
export const updateOutboundTicketStatus = async (
  ticketId: number,
  performedBy: number,
  status: string
) => {
  const res = await api.put(`/api/InventoryOutbound/tickets/${ticketId}/status`, {
    performedBy,
    status,
  });
  return res.data as OutboundOrder;
};

/**
 * Xác nhận hoàn thành phiếu xuất (Manager only)
 */
export const confirmOutboundOrder = async (ticketId: number, performedBy: number) => {
  const res = await api.post(`/api/InventoryOutbound/tickets/${ticketId}/confirm`, {
    performedBy,
  });
  return res.data as OutboundOrder;
};
