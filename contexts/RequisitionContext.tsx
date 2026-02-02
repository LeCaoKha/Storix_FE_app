import { mockRequisitions } from '@/mock/requisitions';
import { GoodsRequisition, RequisitionStatus, RequisitionType } from '@/types/requisition';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface RequisitionContextType {
    requisitions: GoodsRequisition[];
    loading: boolean;

    // CRUD Operations
    getAllRequisitions: () => GoodsRequisition[];
    getRequisitionById: (id: string) => GoodsRequisition | undefined;
    getRequisitionsByStatus: (status: RequisitionStatus) => GoodsRequisition[];
    getRequisitionsByType: (type: RequisitionType) => GoodsRequisition[];
    getApprovedRequisitionsWithoutOrders: (type?: RequisitionType) => GoodsRequisition[];
    searchRequisitions: (query: string) => GoodsRequisition[];

    createRequisition: (data: Omit<GoodsRequisition, 'id' | 'requisitionNumber' | 'createdAt' | 'status'>) => Promise<GoodsRequisition>;
    updateRequisition: (id: string, data: Partial<GoodsRequisition>) => Promise<GoodsRequisition | null>;
    linkOrderToRequisition: (requisitionId: string, orderId: string, orderNumber: string) => Promise<void>;

    // For testing/demo purposes
    mockApproveRequisition: (id: string, reviewedBy: string, reviewedByName: string) => Promise<void>;
    mockRejectRequisition: (id: string, reviewedBy: string, reviewedByName: string, reason: string) => Promise<void>;
}

const RequisitionContext = createContext<RequisitionContextType | undefined>(undefined);

export function RequisitionProvider({ children }: { children: ReactNode }) {
    const [requisitions, setRequisitions] = useState<GoodsRequisition[]>(mockRequisitions);
    const [loading, setLoading] = useState(false);

    const getAllRequisitions = useCallback(() => {
        return requisitions;
    }, [requisitions]);

    const getRequisitionById = useCallback((id: string) => {
        return requisitions.find(req => req.id === id);
    }, [requisitions]);

    const getRequisitionsByStatus = useCallback((status: RequisitionStatus) => {
        return requisitions.filter(req => req.status === status);
    }, [requisitions]);

    const getRequisitionsByType = useCallback((type: RequisitionType) => {
        return requisitions.filter(req => req.type === type);
    }, [requisitions]);

    const getApprovedRequisitionsWithoutOrders = useCallback((type?: RequisitionType) => {
        return requisitions.filter(req =>
            req.status === 'approved' &&
            !req.linkedOrderId &&
            (type ? req.type === type : true)
        );
    }, [requisitions]);

    const searchRequisitions = useCallback((query: string) => {
        const lowerQuery = query.toLowerCase();
        return requisitions.filter(req =>
            req.requisitionNumber.toLowerCase().includes(lowerQuery) ||
            req.purpose.toLowerCase().includes(lowerQuery) ||
            req.items.some(item =>
                item.sku.toLowerCase().includes(lowerQuery) ||
                item.productName.toLowerCase().includes(lowerQuery)
            )
        );
    }, [requisitions]);

    const createRequisition = useCallback(async (
        data: Omit<GoodsRequisition, 'id' | 'requisitionNumber' | 'createdAt' | 'status'>
    ): Promise<GoodsRequisition> => {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const newId = `req-${Date.now()}`;
        const newNumber = `REQ-2026-${String(requisitions.length + 1).padStart(3, '0')}`;

        const newRequisition: GoodsRequisition = {
            ...data,
            id: newId,
            requisitionNumber: newNumber,
            createdAt: new Date(),
            status: 'pending',
        };

        setRequisitions(prev => [newRequisition, ...prev]);
        setLoading(false);

        return newRequisition;
    }, [requisitions.length]);

    const updateRequisition = useCallback(async (
        id: string,
        data: Partial<GoodsRequisition>
    ): Promise<GoodsRequisition | null> => {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        const requisition = requisitions.find(req => req.id === id);
        if (!requisition) {
            setLoading(false);
            return null;
        }

        // Only allow editing if status is pending
        if (requisition.status !== 'pending') {
            setLoading(false);
            throw new Error('Chỉ có thể chỉnh sửa phiếu đề xuất đang chờ duyệt');
        }

        const updatedRequisition = { ...requisition, ...data };

        setRequisitions(prev =>
            prev.map(req => req.id === id ? updatedRequisition : req)
        );

        setLoading(false);
        return updatedRequisition;
    }, [requisitions]);

    const linkOrderToRequisition = useCallback(async (
        requisitionId: string,
        orderId: string,
        orderNumber: string
    ): Promise<void> => {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        setRequisitions(prev =>
            prev.map(req =>
                req.id === requisitionId
                    ? { ...req, linkedOrderId: orderId, linkedOrderNumber: orderNumber }
                    : req
            )
        );

        setLoading(false);
    }, []);

    const mockApproveRequisition = useCallback(async (
        id: string,
        reviewedBy: string,
        reviewedByName: string
    ): Promise<void> => {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        setRequisitions(prev =>
            prev.map(req =>
                req.id === id
                    ? {
                        ...req,
                        status: 'approved' as RequisitionStatus,
                        reviewedBy,
                        reviewedByName,
                        reviewedAt: new Date(),
                    }
                    : req
            )
        );

        setLoading(false);
    }, []);

    const mockRejectRequisition = useCallback(async (
        id: string,
        reviewedBy: string,
        reviewedByName: string,
        reason: string
    ): Promise<void> => {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        setRequisitions(prev =>
            prev.map(req =>
                req.id === id
                    ? {
                        ...req,
                        status: 'rejected' as RequisitionStatus,
                        reviewedBy,
                        reviewedByName,
                        reviewedAt: new Date(),
                        rejectionReason: reason,
                    }
                    : req
            )
        );

        setLoading(false);
    }, []);

    const value: RequisitionContextType = {
        requisitions,
        loading,
        getAllRequisitions,
        getRequisitionById,
        getRequisitionsByStatus,
        getRequisitionsByType,
        getApprovedRequisitionsWithoutOrders,
        searchRequisitions,
        createRequisition,
        updateRequisition,
        linkOrderToRequisition,
        mockApproveRequisition,
        mockRejectRequisition,
    };

    return (
        <RequisitionContext.Provider value={value}>
            {children}
        </RequisitionContext.Provider>
    );
}

export function useRequisitions() {
    const context = useContext(RequisitionContext);
    if (context === undefined) {
        throw new Error('useRequisitions must be used within a RequisitionProvider');
    }
    return context;
}
