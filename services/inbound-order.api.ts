import type {
    CreateInboundRequestPayload,
    InboundOrder,
    UpdateInboundItemPayload
} from '@/types/inbound-order';
import { api } from './axios.instance';

// Re-export types để tiện sử dụng
export type {
    CreateInboundRequestPayload, InboundOrder,
    InboundOrderItem,
    InboundRequest, UpdateInboundItemPayload, UpdateInboundRequestStatusPayload
} from '@/types/inbound-order';

// ============== API Functions ==============

/**
 * Tạo yêu cầu nhập kho mới
 */
export const createInboundRequest = async (payload: CreateInboundRequestPayload) => {
  const res = await api.post('/api/InventoryInbound/create-inbound-request', payload);
  return res.data;
};

/**
 * Cập nhật trạng thái yêu cầu nhập kho (approve/reject)
 */
export const updateInboundRequestStatus = async (
  requestId: number,
  approverId: number,
  status: 'Approved' | 'Rejected'
) => {
  const res = await api.put(`/api/InventoryInbound/update-inbound-request/${requestId}/status`, {
    approverId,
    status,
  });
  return res.data;
};

/**
 * Tạo phiếu nhập (ticket) từ yêu cầu đã duyệt
 */
export const createInboundTicket = async (requestId: number, createdBy: number) => {
  const res = await api.post(`/api/InventoryInbound/create-inbound-ticket/${requestId}/tickets`, {
    createdBy,
  });
  return res.data as InboundOrder;
};

/**
 * Cập nhật số lượng đã nhận cho các items trong phiếu nhập
 * Staff sử dụng API này khi nhận hàng
 */
export const updateInboundTicketItems = async (
  ticketId: number,
  items: UpdateInboundItemPayload[]
) => {
  const res = await api.put(`/api/InventoryInbound/tickets/${ticketId}/items`, items);
  return res.data as InboundOrder;
};

/**
 * Lấy tất cả yêu cầu nhập kho của công ty (requests - chờ duyệt)
 */
export const getAllInboundRequests = async (companyId: number) => {
  const res = await api.get(`/api/InventoryInbound/requests/${companyId}`);
  return res.data;
};

/**
 * Lấy tất cả phiếu nhập kho của công ty (tickets - đang xử lý)
 */
export const getAllInboundTickets = async (companyId: number) => {
  const res = await api.get(`/api/InventoryInbound/tickets/${companyId}`);
  return res.data;
};

/**
 * Lấy chi tiết yêu cầu nhập kho theo ID
 */
export const getInboundRequestById = async (companyId: number, requestId: number) => {
  const res = await api.get(`/api/InventoryInbound/requests/${companyId}/${requestId}`);
  return res.data;
};

/**
 * Lấy chi tiết phiếu nhập kho theo ID
 */
export const getInboundTicketById = async (companyId: number, ticketId: number) => {
  const res = await api.get(`/api/InventoryInbound/tickets/${companyId}/${ticketId}`);
  return res.data;
};
