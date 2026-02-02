import { mockInboundOrders } from '@/mock/inbound-orders';
import { InboundOrder, InboundStatus } from '@/types/inbound-order';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface InboundOrderContextType {
    inboundOrders: InboundOrder[];
    loading: boolean;

    // CRUD Operations
    getAllInboundOrders: () => InboundOrder[];
    getInboundOrderById: (id: string) => InboundOrder | undefined;
    getInboundOrdersByStatus: (status: InboundStatus) => InboundOrder[];
    searchInboundOrders: (query: string) => InboundOrder[];

    createInboundOrder: (data: Omit<InboundOrder, 'id' | 'inboundNumber' | 'createdAt'>) => Promise<InboundOrder>;
    updateInboundOrder: (id: string, data: Partial<InboundOrder>) => Promise<InboundOrder | null>;
    updateInboundStatus: (id: string, status: InboundStatus) => Promise<void>;
    updateReceivedQuantities: (id: string, itemUpdates: Array<{ itemId: string; receivedQty: number }>) => Promise<void>;
}

const InboundOrderContext = createContext<InboundOrderContextType | undefined>(undefined);

export function InboundOrderProvider({ children }: { children: ReactNode }) {
    const [inboundOrders, setInboundOrders] = useState<InboundOrder[]>(mockInboundOrders);
    const [loading, setLoading] = useState(false);

    const getAllInboundOrders = useCallback(() => {
        return inboundOrders;
    }, [inboundOrders]);

    const getInboundOrderById = useCallback((id: string) => {
        return inboundOrders.find(order => order.id === id);
    }, [inboundOrders]);

    const getInboundOrdersByStatus = useCallback((status: InboundStatus) => {
        return inboundOrders.filter(order => order.status === status);
    }, [inboundOrders]);

    const searchInboundOrders = useCallback((query: string) => {
        const lowerQuery = query.toLowerCase();
        return inboundOrders.filter(order =>
            order.inboundNumber.toLowerCase().includes(lowerQuery) ||
            order.supplier.toLowerCase().includes(lowerQuery) ||
            order.poReference?.toLowerCase().includes(lowerQuery) ||
            order.items.some(item =>
                item.sku.toLowerCase().includes(lowerQuery) ||
                item.productName.toLowerCase().includes(lowerQuery)
            )
        );
    }, [inboundOrders]);

    const createInboundOrder = useCallback(async (
        data: Omit<InboundOrder, 'id' | 'inboundNumber' | 'createdAt'>
    ): Promise<InboundOrder> => {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const newId = `inb-${Date.now()}`;
        const newNumber = `IN-2026-${String(inboundOrders.length + 1).padStart(3, '0')}`;

        const newOrder: InboundOrder = {
            ...data,
            id: newId,
            inboundNumber: newNumber,
            createdAt: new Date(),
        };

        setInboundOrders(prev => [newOrder, ...prev]);
        setLoading(false);

        return newOrder;
    }, [inboundOrders.length]);

    const updateInboundOrder = useCallback(async (
        id: string,
        data: Partial<InboundOrder>
    ): Promise<InboundOrder | null> => {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        const order = inboundOrders.find(o => o.id === id);
        if (!order) {
            setLoading(false);
            return null;
        }

        const updatedOrder = { ...order, ...data };

        setInboundOrders(prev =>
            prev.map(o => o.id === id ? updatedOrder : o)
        );

        setLoading(false);
        return updatedOrder;
    }, [inboundOrders]);

    const updateInboundStatus = useCallback(async (
        id: string,
        status: InboundStatus
    ): Promise<void> => {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        const updateData: Partial<InboundOrder> = { status };

        // Auto-set dates based on status
        if (status === 'arrived') {
            updateData.actualArrivalDate = new Date();
        } else if (status === 'completed') {
            updateData.completedAt = new Date();
        }

        setInboundOrders(prev =>
            prev.map(order =>
                order.id === id ? { ...order, ...updateData } : order
            )
        );

        setLoading(false);
    }, []);

    const updateReceivedQuantities = useCallback(async (
        id: string,
        itemUpdates: Array<{ itemId: string; receivedQty: number }>
    ): Promise<void> => {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        setInboundOrders(prev =>
            prev.map(order => {
                if (order.id !== id) return order;

                return {
                    ...order,
                    items: order.items.map(item => {
                        const update = itemUpdates.find(u => u.itemId === item.id);
                        if (!update) return item;
                        return { ...item, receivedQty: update.receivedQty };
                    }),
                };
            })
        );

        setLoading(false);
    }, []);

    const value: InboundOrderContextType = {
        inboundOrders,
        loading,
        getAllInboundOrders,
        getInboundOrderById,
        getInboundOrdersByStatus,
        searchInboundOrders,
        createInboundOrder,
        updateInboundOrder,
        updateInboundStatus,
        updateReceivedQuantities,
    };

    return (
        <InboundOrderContext.Provider value={value}>
            {children}
        </InboundOrderContext.Provider>
    );
}

export function useInboundOrders() {
    const context = useContext(InboundOrderContext);
    if (context === undefined) {
        throw new Error('useInboundOrders must be used within an InboundOrderProvider');
    }
    return context;
}
