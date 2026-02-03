import { api } from '@/services/axios.instance';
import { GoodsRequisition } from '@/types/requisition';

export const getRequisitions = async (): Promise<GoodsRequisition[]> => {
    // Current BE doesn't have a list endpoint, we'll keep using mock data for the list
    // OR try to fetch from /api/InventoryInbound if available (based on research, it only has Create/UpdateStatus)
    try {
        const res = await api.get('/api/InventoryInbound/list'); // Placeholder if you add it later
        return res.data;
    } catch {
        // Fallback to mock for now as Research showed no List endpoint
        return [];
    }
};

export const createRequisition = async (
    data: {
        warehouseId: number;
        supplierId: number;
        items: { productId: number; expectedQuantity: number }[];
    },
    userId: number
): Promise<GoodsRequisition> => {
    const beRequest = {
        ...data,
        requestedBy: userId,
    };

    const res = await api.post('/api/InventoryInbound/create-inbound-request', beRequest);

    return {
        id: res.data.id,
        requisitionNumber: `REQ-${res.data.id}`,
        type: 'inbound',
        status: res.data.status || 'Pending',
        warehouseId: res.data.warehouseId,
        supplierId: res.data.supplierId,
        requestedBy: res.data.requestedBy,
        createdAt: new Date(res.data.createdAt),
        items: data.items.map(item => ({
            id: item.productId,
            sku: '',
            productName: '',
            quantity: item.expectedQuantity,
            unit: '',
        })),
    };
};

