import { mockOutboundOrders } from '@/mock/outbound-orders';
import { OutboundOrder, OutboundStatus } from '@/types/outbound-order';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface OutboundOrderContextType {
    outboundOrders: OutboundOrder[];
    loading: boolean;

    // CRUD Operations
    getAllOutboundOrders: () => OutboundOrder[];
    getOutboundOrderById: (id: string) => OutboundOrder | undefined;
    getOutboundOrdersByStatus: (status: OutboundStatus) => OutboundOrder[];
    searchOutboundOrders: (query: string) => OutboundOrder[];

    createOutboundOrder: (data: Omit<OutboundOrder, 'id' | 'outboundNumber' | 'createdAt'>) => Promise<OutboundOrder>;
    updateOutboundOrder: (id: string, data: Partial<OutboundOrder>) => Promise<OutboundOrder | null>;
    updateOutboundStatus: (id: string, status: OutboundStatus) => Promise<void>;
    updatePickedQuantities: (id: string, itemUpdates: Array<{ itemId: string; qtyPicked: number }>) => Promise<void>;
}

const OutboundOrderContext = createContext<OutboundOrderContextType | undefined>(undefined);

export function OutboundOrderProvider({ children }: { children: ReactNode }) {
    const [outboundOrders, setOutboundOrders] = useState<OutboundOrder[]>(mockOutboundOrders);
    const [loading, setLoading] = useState(false);

    const getAllOutboundOrders = useCallback(() => {
        return outboundOrders;
    }, [outboundOrders]);

    const getOutboundOrderById = useCallback((id: string) => {
        return outboundOrders.find(order => order.id === id);
    }, [outboundOrders]);

    const getOutboundOrdersByStatus = useCallback((status: OutboundStatus) => {
        return outboundOrders.filter(order => order.status === status);
    }, [outboundOrders]);

    const searchOutboundOrders = useCallback((query: string) => {
        const lowerQuery = query.toLowerCase();
        return outboundOrders.filter(order =>
            order.outboundNumber.toLowerCase().includes(lowerQuery) ||
            order.customer.toLowerCase().includes(lowerQuery) ||
            order.salesOrderRef?.toLowerCase().includes(lowerQuery) ||
            order.items.some(item =>
                item.sku.toLowerCase().includes(lowerQuery) ||
                item.productName.toLowerCase().includes(lowerQuery)
            )
        );
    }, [outboundOrders]);

    const createOutboundOrder = useCallback(async (
        data: Omit<OutboundOrder, 'id' | 'outboundNumber' | 'createdAt'>
    ): Promise<OutboundOrder> => {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const newId = `out-${Date.now()}`;
        const newNumber = `OUT-2026-${String(outboundOrders.length + 1).padStart(3, '0')}`;

        const newOrder: OutboundOrder = {
            ...data,
            id: newId,
            outboundNumber: newNumber,
            createdAt: new Date(),
        };

        setOutboundOrders(prev => [newOrder, ...prev]);
        setLoading(false);

        return newOrder;
    }, [outboundOrders.length]);

    const updateOutboundOrder = useCallback(async (
        id: string,
        data: Partial<OutboundOrder>
    ): Promise<OutboundOrder | null> => {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        const order = outboundOrders.find(o => o.id === id);
        if (!order) {
            setLoading(false);
            return null;
        }

        const updatedOrder = { ...order, ...data };

        setOutboundOrders(prev =>
            prev.map(o => o.id === id ? updatedOrder : o)
        );

        setLoading(false);
        return updatedOrder;
    }, [outboundOrders]);

    const updateOutboundStatus = useCallback(async (
        id: string,
        status: OutboundStatus
    ): Promise<void> => {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        const updateData: Partial<OutboundOrder> = { status };

        // Auto-set dates based on status
        if (status === 'shipped') {
            updateData.actualShipDate = new Date();
        } else if (status === 'completed') {
            updateData.completedAt = new Date();
        }

        setOutboundOrders(prev =>
            prev.map(order =>
                order.id === id ? { ...order, ...updateData } : order
            )
        );

        setLoading(false);
    }, []);

    const updatePickedQuantities = useCallback(async (
        id: string,
        itemUpdates: Array<{ itemId: string; qtyPicked: number }>
    ): Promise<void> => {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        setOutboundOrders(prev =>
            prev.map(order => {
                if (order.id !== id) return order;

                return {
                    ...order,
                    items: order.items.map(item => {
                        const update = itemUpdates.find(u => u.itemId === item.id);
                        if (!update) return item;
                        return { ...item, qtyPicked: update.qtyPicked };
                    }),
                };
            })
        );

        setLoading(false);
    }, []);

    const value: OutboundOrderContextType = {
        outboundOrders,
        loading,
        getAllOutboundOrders,
        getOutboundOrderById,
        getOutboundOrdersByStatus,
        searchOutboundOrders,
        createOutboundOrder,
        updateOutboundOrder,
        updateOutboundStatus,
        updatePickedQuantities,
    };

    return (
        <OutboundOrderContext.Provider value={value}>
            {children}
        </OutboundOrderContext.Provider>
    );
}

export function useOutboundOrders() {
    const context = useContext(OutboundOrderContext);
    if (context === undefined) {
        throw new Error('useOutboundOrders must be used within an OutboundOrderProvider');
    }
    return context;
}
