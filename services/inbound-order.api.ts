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
export const createInboundTicket = async (requestId: number, createdBy: number, staffId?: number) => {
  const res = await api.post(`/api/InventoryInbound/create-inbound-ticket/${requestId}/tickets`, {
    CreatedBy: createdBy,
    StaffId: staffId || 0,
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

export const getInboundRequestById = async (companyId: number, requestId: number) => {
  console.log(`[API] Fetching inbound request - companyId: ${companyId}, requestId: ${requestId}`);
  try {
    const res = await api.get(`/api/InventoryInbound/requests/${companyId}/${requestId}`);
    console.log('[API] Inbound request response:', JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (error: any) {
    console.error('[API ERROR] getInboundRequestById failed:', error);
    console.error('[API ERROR] Error response:', error.response?.data);
    console.error('[API ERROR] Error status:', error.response?.status);
    throw error;
  }
};

/**
 * Lấy chi tiết phiếu nhập kho theo ID
 */
export const getInboundTicketById = async (companyId: number, ticketId: number) => {
  const res = await api.get(`/api/InventoryInbound/tickets/${companyId}/${ticketId}`);
  return res.data;
};

/**
 * Lấy danh sách phiếu nhập kho được gán cho Staff
 */
export const getInboundOrdersByStaff = async (companyId: number, staffId: number) => {
  const res = await api.get(`/api/InventoryInbound/get-inbound-orders-for-staff/${companyId}/${staffId}`);
  return res.data as InboundOrder[];
};

/**
 * Xuất file cho Inbound Request
 */
export const exportInboundRequest = async (requestId: number, format: 'csv' | 'excel') => {
  const endpoint = `/api/InventoryInbound/export/inbound-request/${requestId}/${format}`;
  // Lưu ý: Đối với việc tải file trong React Native, ta có thể cần xử lý khác tùy thuộc vào thư viện file system
  // Ở đây ta trả về URL hoặc xử lý Blob tùy theo nhu cầu FE
  return `${api.defaults.baseURL}${endpoint}`;
};

/**
 * Xuất file cho Inbound Ticket
 */
export const exportInboundTicket = async (orderId: number, format: 'csv' | 'excel') => {
  const endpoint = `/api/InventoryInbound/export/inbound-ticket/${orderId}/${format}`;
  return `${api.defaults.baseURL}${endpoint}`;
};
