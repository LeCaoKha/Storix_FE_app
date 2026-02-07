import { InboundOrder } from '@/types/inbound-order';
import { Task, TaskPriority, TaskStatus, TaskType } from '@/types/order';
import { OutboundOrder } from '@/types/outbound-order';
import { api } from './axios.instance';

/**
 * Lấy tất cả tasks của staff hiện tại
 * Tasks được lấy từ InboundOrders và OutboundOrders được gán cho staff
 */
export const getTasks = async (staffId: number, companyId: number): Promise<Task[]> => {
    try {
        const tasks: Task[] = [];

        // Fetch inbound tickets
        try {
            const inboundRes = await api.get<InboundOrder[]>(`/api/InventoryInbound/tickets/${companyId}`);
            const inboundTickets = inboundRes.data || [];
            
            // Filter by staffId and transform to Task
            const inboundTasks = inboundTickets
                .filter(ticket => ticket.staffId === staffId)
                .map(ticket => ({
                    id: `inbound-${ticket.id}`,
                    title: `Nhập kho: ${ticket.referenceCode || `INB-${ticket.id}`}`,
                    description: `Nhận hàng từ ${ticket.supplier?.name || 'nhà cung cấp'} với ${ticket.inboundOrderItems?.length || 0} mặt hàng`,
                    type: TaskType.INBOUND,
                    status: mapInboundStatus(ticket.status),
                    priority: TaskPriority.MEDIUM, // Default priority
                    assignedTo: String(staffId),
                    relatedOrderId: String(ticket.id),
                    location: ticket.warehouse?.name,
                    createdAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
                    updatedAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
                }));
            
            tasks.push(...inboundTasks);
        } catch (err) {
            console.warn('[getTasks] Failed to fetch inbound tickets:', err);
        }

        // Fetch outbound tickets
        try {
            const outboundRes = await api.get<OutboundOrder[]>(`/api/InventoryOutbound/tickets/${companyId}`);
            const outboundTickets = outboundRes.data || [];
            
            // Filter by staffId and transform to Task
            const outboundTasks = outboundTickets
                .filter(ticket => ticket.staffId === staffId)
                .map(ticket => ({
                    id: `outbound-${ticket.id}`,
                    title: `Xuất kho: OUT-${ticket.id}`,
                    description: `Lấy hàng giao đến ${ticket.destination || 'khách hàng'} với ${ticket.outboundOrderItems?.length || 0} mặt hàng`,
                    type: TaskType.OUTBOUND,
                    status: mapOutboundStatus(ticket.status),
                    priority: TaskPriority.MEDIUM, // Default priority
                    assignedTo: String(staffId),
                    relatedOrderId: String(ticket.id),
                    location: ticket.warehouse?.name,
                    createdAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
                    updatedAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
                }));
            
            tasks.push(...outboundTasks);
        } catch (err) {
            console.warn('[getTasks] Failed to fetch outbound tickets:', err);
        }

        // Sort by created date (newest first)
        tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        console.log(`[getTasks] Found ${tasks.length} tasks for staff ${staffId}`);
        return tasks;
    } catch (error) {
        console.error('[getTasks] Error:', error);
        return [];
    }
};

function mapInboundStatus(status?: string): TaskStatus {
    switch (status?.toLowerCase()) {
        case 'created':
        case 'pending':
            return TaskStatus.PENDING;
        case 'processing':
            return TaskStatus.IN_PROGRESS;
        case 'completed':
            return TaskStatus.COMPLETED;
        case 'cancelled':
            return TaskStatus.CANCELLED;
        default:
            return TaskStatus.PENDING;
    }
}

function mapOutboundStatus(status?: string): TaskStatus {
    switch (status?.toLowerCase()) {
        case 'pending':
            return TaskStatus.PENDING;
        case 'picking':
        case 'packing':
        case 'packed':
        case 'ready':
            return TaskStatus.IN_PROGRESS;
        case 'shipped':
        case 'completed':
            return TaskStatus.COMPLETED;
        case 'cancelled':
            return TaskStatus.CANCELLED;
        default:
            return TaskStatus.PENDING;
    }
}
