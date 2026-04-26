import { Task, TaskPriority, TaskStatus, TaskType } from '@/types/order';

import { getInboundOrdersByStaff } from './inbound-order.api';
import { getOutboundOrdersByStaff } from './outbound-order.api';
import { getStockCountTicketsByStaff } from './stock-count.api';

/**
 * Lấy tất cả tasks của staff hiện tại
 */
export const getTasks = async (staffId: number, companyId: number, _currentWarehouseId?: number): Promise<Task[]> => {
    try {
        const tasks: Task[] = [];

        // Fetch inbound tasks assigned to this staff
        try {
            const inboundTickets = await getInboundOrdersByStaff(companyId, staffId);

            const inboundTasks = inboundTickets.map(ticket => ({
                id: `inbound-${ticket.id}`,
                title: `Inbound: ${ticket.referenceCode || `INB-${ticket.id}`}`,
                description: `Receive goods from ${ticket.supplier?.name || 'supplier'} with ${ticket.inboundOrderItems?.length || 0} items`,
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
                    title: `Outbound: OUT-${ticket.id}`,
                    description: `Pick items to deliver to ${ticket.destination || 'customer'} with ${orderItems.length} items`,
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

        // Fetch inventory count tasks assigned to this staff
        // BE: GET /api/InventoryCount/get-tasks-for-staff/{companyId}/{staffId}
        // Roles: 2, 3, 4 — Staff có thể xem danh sách phiếu kiểm kê
        try {
            const countTickets = await getStockCountTicketsByStaff(companyId, staffId);

            const countTasks = countTickets
                .filter(ticket =>
                    // Chỉ lấy các phiếu chưa hoàn tất hoặc đang trong trạng thái cần hành động
                    !['completed', 'approved'].includes((ticket.status || '').toLowerCase())
                )
                .map(ticket => ({
                    id: `inventory-count-${ticket.id}`,
                    title: `Inventory Count: ${ticket.name || `CNT-${ticket.id}`}`,
                    description: `Count ${ticket.itemCount || 0} items in the inventory count ticket`,
                    type: TaskType.INVENTORY_COUNT,
                    status: mapCountStatus(ticket.status),
                    priority: TaskPriority.MEDIUM,
                    assignedTo: String(staffId),
                    relatedOrderId: String(ticket.id),
                    location: ticket.warehouseId ? `Warehouse #${ticket.warehouseId}` : undefined,
                    createdAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
                    updatedAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
                }));

            tasks.push(...countTasks);
        } catch (err) {
            console.warn('[getTasks] Failed to fetch inventory count tasks:', err);
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
        case 'waiting for payment':
            return TaskStatus.PENDING;
        case 'partially completed':
            return TaskStatus.IN_PROGRESS;
        case 'completed':
            return TaskStatus.COMPLETED;
        default:
            return TaskStatus.PENDING;
    }
}

function mapOutboundStatus(status?: string): TaskStatus {
    // BE OutboundOrder statuses: Created, Picking, QualityCheck, IssueReported, Packing, LoadHandover, Completed
    switch (status?.toLowerCase()) {
        case 'created':
            return TaskStatus.PENDING;
        case 'picking':
        case 'qualitycheck':
        case 'packing':
        case 'loadhandover':
        case 'issuereported':
            return TaskStatus.IN_PROGRESS;
        case 'completed':
            return TaskStatus.COMPLETED;
        default:
            return TaskStatus.PENDING;
    }
}

function mapCountStatus(status?: string): TaskStatus {
    // BE InventoryCountTicket statuses: Pending, In Progress, Finished, Approved, Rejected
    switch (status?.toLowerCase()) {
        case 'draft':
        case 'pending':
            return TaskStatus.PENDING;
        case 'in progress':
        case 'inprogress':
        case 'in_progress':
        case 'pendingapproval':
        case 'pending_approval':
            return TaskStatus.IN_PROGRESS;
        case 'finished':
        case 'approved':
        case 'completed':
        case 'rejected':
            return TaskStatus.COMPLETED;
        default:
            return TaskStatus.PENDING;
    }
}

