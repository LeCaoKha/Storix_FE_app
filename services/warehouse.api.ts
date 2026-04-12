import { UserWarehouseAssignment } from '@/types/auth.types';
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
  fallbackWarehouse?: { id?: number; name?: string },
  fallbackAssignments?: UserWarehouseAssignment[]
): Promise<WarehouseSummary[]> => {
  console.log('[getAccessibleWarehouses] start', {
    companyId,
    roleId,
    staffId,
    fallbackWarehouse,
    fallbackAssignments: fallbackAssignments?.map((assignment) => ({
      warehouseId: assignment.warehouseId,
      warehouseName: assignment.warehouse?.name || null,
    })) || [],
  });

  // Company Admin: dùng endpoint chuẩn từ backend
  if (roleId === 2) {
    const warehouses = await getWarehouses(companyId);
    console.log('[getAccessibleWarehouses] role 2 backend list', {
      count: warehouses.length,
      warehouses: warehouses.map((warehouse) => ({ id: warehouse.id, name: warehouse.name })),
    });
    return warehouses;
  }

  // Manager/Staff: ưu tiên toàn bộ warehouse assignments có trong profile.
  const assignedWarehouses = new Map<number, WarehouseSummary>();

  fallbackAssignments?.forEach((assignment) => {
    if (!assignment?.warehouseId || assignedWarehouses.has(assignment.warehouseId)) return;

    assignedWarehouses.set(assignment.warehouseId, {
      id: assignment.warehouseId,
      companyId,
      name: assignment.warehouse?.name || `Warehouse #${assignment.warehouseId}`,
      status: 'Active',
    });
  });

  if (fallbackWarehouse?.id && !assignedWarehouses.has(fallbackWarehouse.id)) {
    assignedWarehouses.set(fallbackWarehouse.id, {
      id: fallbackWarehouse.id,
      companyId,
      name: fallbackWarehouse.name || `Warehouse #${fallbackWarehouse.id}`,
      status: 'Active',
    });
  }

  if (assignedWarehouses.size > 0) {
    const warehouses = Array.from(assignedWarehouses.values());
    console.log('[getAccessibleWarehouses] using fallback assignments', {
      count: warehouses.length,
      warehouses: warehouses.map((warehouse) => ({ id: warehouse.id, name: warehouse.name })),
    });
    return warehouses;
  }

  // Staff: suy ra kho từ các inbound/outbound orders được gán
  if (!staffId) {
    console.log('[getAccessibleWarehouses] no staffId and no fallback warehouses');
    return [];
  }

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

  const warehouses = Array.from(warehousesMap.values());

  console.log('[getAccessibleWarehouses] inferred from orders', {
    inboundStatus: inboundResult.status,
    outboundStatus: outboundResult.status,
    count: warehouses.length,
    warehouses: warehouses.map((warehouse) => ({ id: warehouse.id, name: warehouse.name })),
  });

  return warehouses;
};

/**
 * Lấy cấu trúc warehouse layout với zones, shelves, navigation nodes/edges
 * Staff (roleId=4) có thể truy cập API này
 */
export const getWarehouseStructure = async (
  companyId: number,
  warehouseId: number
): Promise<WarehouseStructure> => {
  const normalizedCompanyId = Number(companyId);
  const normalizedWarehouseId = Number(warehouseId);

  if (
    !Number.isFinite(normalizedCompanyId) ||
    normalizedCompanyId <= 0 ||
    !Number.isFinite(normalizedWarehouseId) ||
    normalizedWarehouseId <= 0
  ) {
    console.warn('[getWarehouseStructure] skip request because ids are invalid', {
      companyId,
      warehouseId,
    });

    return {
      width: 1,
      height: 1,
      zones: [],
      nodes: [],
      edges: [],
    };
  }

  try {
    const response = await api.get<WarehouseStructure>(
      `/api/get-warehouse-structure/${normalizedCompanyId}/${normalizedWarehouseId}`
    );
    return response.data;
  } catch (error: any) {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.message || '');

    // Graceful fallback for known backend schema mismatch cases.
    if (status === 400 && /column\s+.*isvulnerable\s+does not exist/i.test(message)) {
      console.warn('[getWarehouseStructure] fallback empty structure due to schema mismatch', {
        companyId,
        warehouseId,
        status,
        message,
      });

      return {
        width: 1,
        height: 1,
        zones: [],
        nodes: [],
        edges: [],
      };
    }

    throw error;
  }
};
