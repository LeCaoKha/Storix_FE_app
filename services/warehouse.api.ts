import { WarehouseStructure, WarehouseSummary } from '@/types/warehouse';
import { api } from './axios.instance';
import { getInboundOrdersByStaff } from './inbound-order.api';
import { getOutboundOrdersByStaff } from './outbound-order.api';

/**
 * Lấy danh sách warehouses của company
 */
export const getWarehouses = async (companyId: number): Promise<WarehouseSummary[]> => {
  const response = await api.get(`/api/company-warehouses/${companyId}/warehouses`);
  return response.data;
};

/**
 * Lấy danh sách kho khả dụng theo role để tránh gọi endpoint admin-only cho staff/manager.
 */
export const getAccessibleWarehouses = async (
  companyId: number,
  roleId: number,
  staffId?: number,
  fallbackWarehouse?: { id?: number; name?: string }
): Promise<WarehouseSummary[]> => {
  // Company Admin: dùng endpoint chuẩn từ backend
  if (roleId === 2) {
    return getWarehouses(companyId);
  }

  // Manager/Staff: ưu tiên warehouse được gán trong profile nếu có
  if (fallbackWarehouse?.id) {
    return [
      {
        id: fallbackWarehouse.id,
        companyId,
        name: fallbackWarehouse.name || `Warehouse #${fallbackWarehouse.id}`,
        status: 'Active',
      },
    ];
  }

  // Staff: suy ra kho từ các inbound/outbound orders được gán
  if (!staffId) return [];

  const [inboundResult, outboundResult] = await Promise.allSettled([
    getInboundOrdersByStaff(companyId, staffId),
    getOutboundOrdersByStaff(companyId, staffId),
  ]);

  const warehousesMap = new Map<number, WarehouseSummary>();

  if (inboundResult.status === 'fulfilled') {
    inboundResult.value.forEach((order) => {
      const id = order.warehouse?.id ?? order.warehouseId;
      if (!id || warehousesMap.has(id)) return;
      warehousesMap.set(id, {
        id,
        companyId,
        name: order.warehouse?.name || `Warehouse #${id}`,
        status: 'Active',
      });
    });
  }

  if (outboundResult.status === 'fulfilled') {
    outboundResult.value.forEach((order: any) => {
      const id = order.warehouse?.id ?? order.warehouseId;
      if (!id || warehousesMap.has(id)) return;
      warehousesMap.set(id, {
        id,
        companyId,
        name: order.warehouse?.name || `Warehouse #${id}`,
        status: 'Active',
      });
    });
  }

  return Array.from(warehousesMap.values());
};

/**
 * Lấy cấu trúc warehouse layout với zones, shelves, navigation nodes/edges
 * Staff (roleId=4) có thể truy cập API này
 */
export const getWarehouseStructure = async (
  companyId: number,
  warehouseId: number
): Promise<WarehouseStructure> => {
  const response = await api.get<WarehouseStructure>(
    `/api/get-warehouse-structure/${companyId}/${warehouseId}`
  );
  return response.data;
};
