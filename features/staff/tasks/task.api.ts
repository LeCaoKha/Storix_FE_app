import { Task } from '@/types/order';

// export const getTasks = async (): Promise<Task[]> => {
//   const res = await api.get('/tasks');
//   return res.data;
// }

export const getTasks = async (): Promise<Task[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock data from TasksScreen.tsx
    return [
        {
            id: '1',
            type: 'outbound',
            orderNumber: 'OUT-2026-001',
            orderId: 'out-001',
            status: 'in_progress',
            priority: 'high',
            itemCount: 3,
            assignedDateTime: new Date('2026-01-30T10:00:00'),
            warehouse: 'WH-HCM-01',
            customerOrSupplier: 'ABC Electronics Co.',
            progress: 100,
        },
        {
            id: '2',
            type: 'inbound',
            orderNumber: 'IN-2026-002',
            orderId: 'inb-002',
            status: 'in_progress',
            priority: 'medium',
            itemCount: 3,
            assignedDateTime: new Date('2026-01-30T09:00:00'),
            warehouse: 'WH-HCM-01',
            customerOrSupplier: 'Tech Supplies Vietnam',
            progress: 0,
        },
        {
            id: '3',
            type: 'outbound',
            orderNumber: 'OUT-2026-003',
            orderId: 'out-003',
            status: 'pending',
            priority: 'medium',
            itemCount: 5,
            assignedDateTime: new Date('2026-01-30T08:00:00'),
            warehouse: 'WH-HCM-01',
            customerOrSupplier: 'XYZ Retail Ltd.',
        },
        {
            id: '4',
            type: 'count',
            orderNumber: 'CNT-2026-001',
            orderId: 'cnt-001',
            status: 'in_progress',
            priority: 'high',
            itemCount: 3,
            assignedDateTime: new Date('2026-01-31T14:00:00'),
            warehouse: 'WH-HCM-01',
            location: 'Zone A - Rack 04',
        },
        {
            id: '5',
            type: 'inbound',
            orderNumber: 'IN-2026-004',
            orderId: 'inb-004',
            status: 'completed',
            priority: 'low',
            itemCount: 8,
            assignedDateTime: new Date('2026-01-29T07:00:00'),
            warehouse: 'WH-HCM-01',
            customerOrSupplier: 'Global Imports Inc.',
            progress: 100,
        },
        {
            id: '6',
            type: 'putaway',
            orderNumber: 'PUT-2026-001',
            orderId: 'put-001',
            status: 'pending',
            priority: 'low',
            itemCount: 12,
            assignedDateTime: new Date('2026-01-28T15:00:00'),
            warehouse: 'WH-HCM-01',
            location: 'Zone B - Rack 12',
        },
    ];
};
