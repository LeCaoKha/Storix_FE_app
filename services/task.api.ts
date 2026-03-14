import { Task, TaskPriority, TaskStatus, TaskType } from '@/types/order';

import { getStockCountTickets } from './stock-count.api';
import { getInboundOrdersByStaff } from './inbound-order.api';
import { getOutboundOrdersByStaff } from './outbound-order.api';
import { getTransferOrders } from './transfer.api';

/**
 * Lấy tất cả tasks của staff hiện tại
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

            // Tạo task putaway từ inbound tickets chưa hoàn tất.
            const putawayTasks = inboundTickets
                .filter(ticket => (ticket.status || '').toLowerCase() !== 'completed')
                .map(ticket => ({
                    id: `putaway-${ticket.id}`,
                    title: `Xếp hàng: ${ticket.referenceCode || `PUT-${ticket.id}`}`,
                    description: `Sắp xếp ${ticket.inboundOrderItems?.length || 0} mặt hàng vào vị trí lưu trữ`,
                    type: TaskType.PUTAWAY,
                    status: mapInboundStatus(ticket.status),
                    priority: TaskPriority.MEDIUM,
                    assignedTo: String(staffId),
                    relatedOrderId: String(ticket.id),
                    location: ticket.warehouse?.name,
                    createdAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
                    updatedAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
                }));

            tasks.push(...putawayTasks);
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

        // Fetch inventory count tasks assigned to this staff
        // BE: GET /api/inventory-count-tickets?warehouseId=&status=
        // Roles: 2, 3, 4 — Staff có thể xem danh sách phiếu kiểm kê
        try {
            const countTickets = await getStockCountTickets(companyId);

            const countTasks = countTickets
                .filter(ticket =>
                    // Chỉ lấy các phiếu chưa hoàn tất hoặc đang trong trạng thái cần hành động
                    !['completed', 'approved'].includes((ticket.status || '').toLowerCase())
                )
                .map(ticket => ({
                    id: `inventory-count-${ticket.id}`,
                    title: `Kiểm kê: ${ticket.name || `CNT-${ticket.id}`}`,
                    description: `Đếm kiểm ${ticket.itemCount || 0} mặt hàng trong phiếu kiểm kê`,
                    type: TaskType.INVENTORY_COUNT,
                    status: mapCountStatus(ticket.status),
                    priority: TaskPriority.MEDIUM,
                    assignedTo: String(staffId),
                    relatedOrderId: String(ticket.id),
                    location: ticket.warehouseId ? `Kho #${ticket.warehouseId}` : undefined,
                    createdAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
                    updatedAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
                }));

            tasks.push(...countTasks);
        } catch (err) {
            console.warn('[getTasks] Failed to fetch inventory count tasks:', err);
        }

        // Fetch warehouse transfer tasks
        // BE: GET /api/warehouse-transfers?status=
        try {
            const transferOrders = await getTransferOrders({
                status: 'Approved,Picking,Packed,Shipped'
            });

            const transferTasks = transferOrders.map(order => ({
                id: `transfer-${order.id}`,
                title: `Điều chuyển: ${order.referenceCode || `TRS-${order.id}`}`,
                description: `Chuyển hàng từ ${order.sourceWarehouse?.name || 'Kho nguồn'} đến ${order.destinationWarehouse?.name || 'Kho đích'}`,
                type: TaskType.TRANSFER,
                status: mapTransferStatus(order.status),
                priority: TaskPriority.MEDIUM,
                assignedTo: String(staffId),
                relatedOrderId: String(order.id),
                location: order.sourceWarehouse?.name,
                createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
                updatedAt: order.createdAt ? new Date(order.createdAt) : new Date(),
            }));

            tasks.push(...transferTasks);
        } catch (err) {
            console.warn('[getTasks] Failed to fetch transfer tasks:', err);
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
    // BE InventoryCountTicket statuses: Draft, InProgress, PendingApproval, Approved, Completed
    switch (status?.toLowerCase()) {
        case 'draft':
            return TaskStatus.PENDING;
        case 'inprogress':
        case 'in_progress':
        case 'pendingapproval':
        case 'pending_approval':
            return TaskStatus.IN_PROGRESS;
        case 'approved':
        case 'completed':
            return TaskStatus.COMPLETED;
        default:
            return TaskStatus.PENDING;
    }
}

function mapTransferStatus(status?: string): TaskStatus {
    // BE Transfer statuses: Draft, Submitted, Approved, Picking, Packed, Shipped, Received, Cancelled
    switch (status?.toLowerCase()) {
        case 'approved':
            return TaskStatus.PENDING;
        case 'picking':
        case 'packed':
        case 'shipped':
            return TaskStatus.IN_PROGRESS;
        case 'received':
            return TaskStatus.COMPLETED;
        default:
            return TaskStatus.PENDING;
    }
}
