import { Task, TaskPriority, TaskStatus, TaskType } from '@/types/order';

import { getInboundOrdersByStaff } from './inbound-order.api';
import { getOutboundOrdersByStaff } from './outbound-order.api';

/**
 * Lấy tất cả tasks của staff hiện tại
 * Sử dụng endpoint mới từ backend để lấy trực tiếp các order được gán cho staff
 */
export const getTasks = async (staffId: number, companyId: number): Promise<Task[]> => {
    try {
        const tasks: Task[] = [];

        // Fetch inbound tasks assigned to this staff
        try {
            const inboundTickets = await getInboundOrdersByStaff(companyId, staffId);

            const inboundTasks = inboundTickets.map(ticket => ({
                id: `inbound-${ticket.id}`,
                title: `Nhập kho: ${ticket.referenceCode || `INB-${ticket.id}`}`,
                description: `Nhận hàng từ ${ticket.supplier?.name || 'nhà cung cấp'} với ${ticket.inboundOrderItems?.length || 0} mặt hàng`,
                type: TaskType.INBOUND,
                status: mapInboundStatus(ticket.status),
                priority: TaskPriority.MEDIUM,
                assignedTo: String(staffId),
                relatedOrderId: String(ticket.id),
                location: ticket.warehouse?.name,
                createdAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
                updatedAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
            }));

            tasks.push(...inboundTasks);
        } catch (err) {
            console.warn('[getTasks] Failed to fetch inbound tasks:', err);
        }

        // Fetch outbound tasks assigned to this staff
        try {
            const outboundTickets = await getOutboundOrdersByStaff(companyId, staffId);

            const outboundTasks = outboundTickets.map(ticket => {
                const orderItems = ticket.items || ticket.outboundOrderItems || [];
                return {
                    id: `outbound-${ticket.id}`,
                    title: `Xuất kho: OUT-${ticket.id}`,
                    description: `Lấy hàng giao đến ${ticket.destination || 'khách hàng'} với ${orderItems.length} mặt hàng`,
                    type: TaskType.OUTBOUND,
                    status: mapOutboundStatus(ticket.status),
                    priority: TaskPriority.MEDIUM,
                    assignedTo: String(staffId),
                    relatedOrderId: String(ticket.id),
                    location: ticket.warehouse?.name,
                    createdAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
                    updatedAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
                };
            });

            tasks.push(...outboundTasks);
        } catch (err) {
            console.warn('[getTasks] Failed to fetch outbound tasks:', err);
        }



        // Sort by created date (newest first)
        tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        console.log(`[getTasks] Found ${tasks.length} tasks for staff ${staffId} from backend`);
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
        case 'qualitycheck':
        case 'packing':
        case 'packed':
        case 'ready':
        case 'loadhandover':
        case 'issuereported':
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


