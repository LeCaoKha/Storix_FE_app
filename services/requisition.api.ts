import { GoodsRequisition, RequisitionStatus } from '@/types/requisition';
import { api } from './axios.instance';

export const getRequisitions = async (): Promise<GoodsRequisition[]> => {
    // Current BE doesn't have a list endpoint, using mock data
    try {
        const res = await api.get('/api/InventoryInbound/requests/1'); // Try with companyId=1
        // If we get data, transform it
        if (res.data && Array.isArray(res.data)) {
            return res.data.map((item: any) => ({
                id: item.id,
                requisitionNumber: `REQ-${item.id}`,
                type: 'inbound' as const,
                status: (item.status || 'pending').toLowerCase() as RequisitionStatus,
                warehouseId: item.warehouseId || 1,
                supplierId: item.supplierId || 1,
                requestedBy: item.requestedBy || 1,
                purpose: item.purpose || 'Nhập hàng',
                notes: item.notes || '',
                expectedDate: item.expectedDate || new Date().toISOString(),
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.updatedAt || new Date().toISOString(),
                items: [],
            }));
        }
    } catch (error) {
        console.warn('API not available, using mock data');
    }

    // Return mock data for demo
    return [
        {
            id: 1,
            requisitionNumber: 'REQ-2026-001',
            type: 'inbound',
            status: 'pending',
            warehouseId: 1,
            warehouse: 'Kho chính HCM',
            supplierId: 1,
            supplier: 'Dell Vietnam',
            requestedBy: 1,
            purpose: 'Nhập laptop mới cho quý 1/2026',
            notes: 'Ưu tiên hàng có sẵn',
            expectedDate: new Date('2026-02-15').toISOString(),
            createdAt: new Date('2026-02-01').toISOString(),
            updatedAt: new Date('2026-02-01').toISOString(),
            items: [
                {
                    id: 1,
                    sku: 'DELL-XPS-001',
                    productName: 'Dell XPS 15',
                    quantity: 50,
                    unit: 'chiếc',
                },
                {
                    id: 2,
                    sku: 'DELL-INS-002',
                    productName: 'Dell Inspiron 14',
                    quantity: 100,
                    unit: 'chiếc',
                },
            ],
        },
        {
            id: 2,
            requisitionNumber: 'REQ-2026-002',
            type: 'outbound',
            status: 'approved',
            warehouseId: 1,
            warehouse: 'Kho chính HCM',
            supplierId: 2,
            requestedBy: 2,
            purpose: 'Xuất hàng cho khách hàng ABC Corp',
            notes: 'Giao trước 10h sáng',
            expectedDate: new Date('2026-02-10').toISOString(),
            createdAt: new Date('2026-02-03').toISOString(),
            updatedAt: new Date('2026-02-04').toISOString(),
            items: [
                {
                    id: 3,
                    sku: 'DELL-XPS-001',
                    productName: 'Dell XPS 15',
                    quantity: 20,
                    unit: 'chiếc',
                },
            ],
        },
    ];
};

export const createRequisition = async (
    data: {
        warehouseId: number;
        supplierId: number;
        note?: string;
        expectedArrivalDate?: string;
        orderDiscount?: number;
        items: {
            productId: number;
            expectedQuantity: number;
            price?: number;
            lineDiscount?: number;
        }[];
    },
    userId: number
): Promise<GoodsRequisition> => {
    const beRequest = {
        warehouseId: data.warehouseId,
        supplierId: data.supplierId,
        requestedBy: userId,
        note: data.note || '',
        expectedArrivalDate: data.expectedArrivalDate || new Date().toISOString().split('T')[0],
        orderDiscount: data.orderDiscount || 0,
        items: data.items.map(item => ({
            productId: item.productId,
            expectedQuantity: item.expectedQuantity,
            price: item.price || 0,
            lineDiscount: item.lineDiscount || 0,
        })),
    };

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

