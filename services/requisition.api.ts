import { GoodsRequisition, RequisitionStatus } from '@/types/requisition';
import { api } from './axios.instance';

export const getRequisitions = async (companyId: number): Promise<GoodsRequisition[]> => {
    try {
        const res = await api.get(`/api/InventoryInbound/requests/${companyId}`);

        if (res.data && Array.isArray(res.data)) {
            return res.data.map((item: any) => ({
                id: item.id,
                requisitionNumber: item.code || `REQ-${item.id}`,
                type: 'inbound' as const,
                status: (item.status || 'Pending').toLowerCase() as RequisitionStatus,
                warehouseId: item.warehouseId || 0,
                warehouse: item.warehouse?.name || '',
                supplierId: item.supplierId || 0,
                supplier: item.supplier?.name || '',
                requestedBy: item.requestedBy || 0,
                createdByName: item.requestedByUser?.fullName || '',
                purpose: 'Nhập hàng', // Fixed - backend only has Note field
                notes: item.note || '',
                expectedDate: item.expectedArrivalDate || new Date().toISOString(),
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.createdAt || new Date().toISOString(),
                reviewedByName: item.approvedByUser?.fullName,
                reviewedAt: item.approvedAt,
                items: (item.inboundOrderItems || []).map((orderItem: any) => ({
                    id: orderItem.id,
                    sku: orderItem.sku || '',
                    productName: orderItem.name || '',
                    quantity: orderItem.expectedQuantity || 0,
                    unit: 'Cái',
                })),
            }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching requisitions:', error);
        return [];
    }
};

export const createRequisition = async (
    data: {
        warehouseId: number;
        supplierId: number;
        note: string;
        expectedDate: string;
        items: { productId: number; expectedQuantity: number; price: number; lineDiscount: number }[];
    },
    userId: number
): Promise<GoodsRequisition> => {
    const beRequest = {
        WarehouseId: data.warehouseId,
        SupplierId: data.supplierId,
        RequestedBy: userId,
        Note: data.note,
        ExpectedArrivalDate: data.expectedDate,
        OrderDiscount: 0,
        Items: data.items.map(item => ({
            ProductId: item.productId,
            ExpectedQuantity: item.expectedQuantity,
            Price: item.price,
            LineDiscount: item.lineDiscount
        }))
    };

    console.log('Sending request to API:', JSON.stringify(beRequest, null, 2));
    const res = await api.post('/api/InventoryInbound/create-inbound-request', beRequest);

    return {
        id: res.data.id,
        requisitionNumber: `REQ-${res.data.id}`,
        type: 'inbound',
        status: (res.data.status || 'Pending').toLowerCase() as RequisitionStatus,
        warehouseId: res.data.warehouseId,
        supplierId: res.data.supplierId,
        requestedBy: res.data.requestedBy,
        purpose: res.data.purpose || 'Nhập kho',
        notes: res.data.notes || '',
        expectedDate: res.data.expectedDate || new Date().toISOString(),
        createdAt: res.data.createdAt || new Date().toISOString(),
        updatedAt: res.data.updatedAt || new Date().toISOString(),
        items: data.items.map(item => ({
            id: item.productId,
            sku: '',
            productName: '',
            quantity: item.expectedQuantity,
            unit: 'pcs',
        })),
    };
};

export const getRequisitionById = async (companyId: number, id: number): Promise<GoodsRequisition | null> => {
    try {
        const res = await api.get(`/api/InventoryInbound/requests/${companyId}/${id}`);

        if (res.data) {
            const item = res.data;
            return {
                id: item.id,
                requisitionNumber: item.code || `REQ-${item.id}`,
                type: 'inbound' as const,
                status: (item.status || 'Pending').toLowerCase() as RequisitionStatus,
                warehouseId: item.warehouseId || 0,
                warehouse: item.warehouse?.name || '',
                supplierId: item.supplierId || 0,
                supplier: item.supplier?.name || '',
                requestedBy: item.requestedBy || 0,
                createdByName: item.requestedByUser?.fullName || '',
                purpose: 'Nhập hàng', // Fixed - backend only has Note field
                notes: item.note || '',
                expectedDate: item.expectedArrivalDate || new Date().toISOString(),
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.createdAt || new Date().toISOString(),
                reviewedByName: item.approvedByUser?.fullName,
                reviewedAt: item.approvedAt,
                items: (item.inboundOrderItems || []).map((orderItem: any) => ({
                    id: orderItem.id,
                    sku: orderItem.sku || '',
                    productName: orderItem.name || '',
                    quantity: orderItem.expectedQuantity || 0,
                    unit: 'Cái',
                })),
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching requisition detail:', error);
        return null;
    }
};

// ========== OUTBOUND APIs ==========

export const getOutboundRequisitions = async (companyId: number): Promise<GoodsRequisition[]> => {
    try {
        const res = await api.get(`/api/InventoryOutbound/requests/${companyId}`);

        if (res.data && Array.isArray(res.data)) {
            return res.data.map((item: any) => ({
                id: item.id,
                requisitionNumber: item.code || `OUT-${item.id}`,
                type: 'outbound' as const,
                status: (item.status || 'Pending').toLowerCase() as RequisitionStatus,
                warehouseId: item.warehouseId || 0,
                warehouse: item.warehouse?.name || '',
                supplierId: 0, // outbound doesn't have supplier
                supplier: item.destination || 'Khách hàng',
                requestedBy: item.requestedBy || 0,
                createdByName: item.requestedByUser?.fullName || '',
                purpose: 'Xuất hàng',
                notes: item.destination || '',
                expectedDate: item.createdAt || new Date().toISOString(),
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.createdAt || new Date().toISOString(),
                reviewedByName: item.approvedByUser?.fullName,
                reviewedAt: item.approvedAt,
                items: (item.items || []).map((orderItem: any) => ({
                    id: orderItem.id,
                    sku: orderItem.productId?.toString() || '',
                    productName: orderItem.productName || '',
                    quantity: orderItem.quantity || 0,
                    unit: 'Cái',
                })),
            }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching outbound requisitions:', error);
        return [];
    }
};

export const createOutboundRequisition = async (
    data: {
        warehouseId: number;
        destination: string;
        items: { productId: number; quantity: number }[];
    },
    userId: number
): Promise<GoodsRequisition> => {
    const beRequest = {
        WarehouseId: data.warehouseId,
        Destination: data.destination,
        RequestedBy: userId,
        Items: data.items.map(item => ({
            ProductId: item.productId,
            Quantity: item.quantity
        }))
    };

    console.log('Sending outbound request to API:', JSON.stringify(beRequest, null, 2));
    const res = await api.post('/api/InventoryOutbound/create-outbound-request', beRequest);

    return {
        id: res.data.id,
        requisitionNumber: `OUT-${res.data.id}`,
        type: 'outbound',
        status: (res.data.status || 'Pending').toLowerCase() as RequisitionStatus,
        warehouseId: res.data.warehouseId,
        supplierId: 0,
        requestedBy: res.data.requestedBy,
        purpose: 'Xuất kho',
        notes: res.data.destination || '',
        expectedDate: new Date().toISOString(),
        createdAt: res.data.createdAt || new Date().toISOString(),
        updatedAt: res.data.createdAt || new Date().toISOString(),
        items: data.items.map(item => ({
            id: item.productId,
            sku: '',
            productName: '',
            quantity: item.quantity,
            unit: 'pcs',
        })),
    };
};

export const getOutboundRequisitionById = async (companyId: number, id: number): Promise<GoodsRequisition | null> => {
    try {
        const res = await api.get(`/api/InventoryOutbound/requests/${companyId}/${id}`);

        if (res.data) {
            const item = res.data;
            return {
                id: item.id,
                requisitionNumber: item.code || `OUT-${item.id}`,
                type: 'outbound' as const,
                status: (item.status || 'Pending').toLowerCase() as RequisitionStatus,
                warehouseId: item.warehouseId || 0,
                warehouse: item.warehouse?.name || '',
                supplierId: 0,
                supplier: item.destination || 'Khách hàng',
                requestedBy: item.requestedBy || 0,
                createdByName: item.requestedByUser?.fullName || '',
                purpose: 'Xuất hàng',
                notes: item.destination || '',
                expectedDate: item.createdAt || new Date().toISOString(),
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.createdAt || new Date().toISOString(),
                reviewedByName: item.approvedByUser?.fullName,
                reviewedAt: item.approvedAt,
                items: (item.items || []).map((orderItem: any) => ({
                    id: orderItem.id,
                    sku: orderItem.productId?.toString() || '',
                    productName: orderItem.productName || '',
                    quantity: orderItem.quantity || 0,
                    unit: 'Cái',
                })),
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching outbound requisition detail:', error);
        return null;
    }
};

export const updateInboundRequestStatus = async (id: number, approverId: number, status: string) => {
    return await api.put(`/api/InventoryInbound/update-inbound-request/${id}/status`, {
        ApproverId: approverId,
        Status: status
    });
};

export const updateOutboundRequestStatus = async (id: number, approverId: number, status: string) => {
    return await api.put(`/api/InventoryOutbound/update-outbound-request/${id}/status`, {
        ApproverId: approverId,
        Status: status
    });
};

