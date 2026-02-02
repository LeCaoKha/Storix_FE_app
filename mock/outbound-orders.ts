import { OutboundOrder } from '@/types/outbound-order';

export const mockOutboundOrders: OutboundOrder[] = [
    {
        id: 'out-001',
        outboundNumber: 'OUT-2026-001',
        requisitionId: 'req-002',
        requisitionNumber: 'REQ-2026-002',

        customer: 'Công ty ABC Technology',
        customerContact: '0908 111 222',
        destination: '123 Đường Nguyễn Huệ, Q1, TP.HCM',
        salesOrderRef: 'SO-2026-012',

        warehouse: 'Warehouse Central',

        items: [
            {
                id: 'out-item-001',
                sku: 'LAP-DEL-001',
                productName: 'Dell Latitude 5520',
                qtyToPick: 10,
                qtyPicked: 10,
                unit: 'cái',
                pickLocations: [
                    { locationId: 'loc-001', locationCode: 'A-01-03', quantity: 10, sequence: 1 },
                ],
                batchNumber: 'BATCH-2026-01',
            },
            {
                id: 'out-item-002',
                sku: 'MON-SAM-001',
                productName: 'Samsung 24" Monitor',
                qtyToPick: 10,
                qtyPicked: 10,
                unit: 'cái',
                pickLocations: [
                    { locationId: 'loc-002', locationCode: 'A-02-01', quantity: 10, sequence: 2 },
                ],
                batchNumber: 'BATCH-2026-01',
            },
        ],

        optimizedRoute: ['A-01-03', 'A-02-01'],

        status: 'completed',
        expectedShipDate: new Date('2026-02-02'),
        actualShipDate: new Date('2026-02-02T15:00:00'),

        pickedBy: 'staff-001',
        pickedByName: 'Trần Văn B',
        packedBy: 'staff-001',
        packedByName: 'Trần Văn B',

        shipMethod: 'Express',
        carrier: 'Grab Express',
        trackingNumber: 'GRB123456789',

        createdAt: new Date('2026-02-01'),
        createdBy: 'mgr-001',
        createdByName: 'Nguyen Van A',
        completedAt: new Date('2026-02-02T16:00:00'),

        notes: 'Đã xuất kho và giao hàng',
    },
    {
        id: 'out-002',
        outboundNumber: 'OUT-2026-002',

        customer: 'Khách hàng cá nhân',
        customerContact: '0909 333 444',
        destination: '456 Đường Lê Lợi, Q3, TP.HCM',
        salesOrderRef: 'SO-2026-013',

        warehouse: 'Warehouse Central',

        items: [
            {
                id: 'out-item-003',
                sku: 'KEY-LOG-001',
                productName: 'Logitech Keyboard K120',
                qtyToPick: 5,
                qtyPicked: 0,
                unit: 'cái',
                pickLocations: [
                    { locationId: 'loc-003', locationCode: 'B-01-01', quantity: 5, sequence: 1 },
                ],
            },
            {
                id: 'out-item-004',
                sku: 'MOU-LOG-001',
                productName: 'Logitech Mouse M100',
                qtyToPick: 5,
                qtyPicked: 0,
                unit: 'cái',
                pickLocations: [
                    { locationId: 'loc-004', locationCode: 'B-01-02', quantity: 5, sequence: 2 },
                ],
            },
        ],

        optimizedRoute: ['B-01-01', 'B-01-02'],

        status: 'open',
        expectedShipDate: new Date('2026-02-03'),

        createdAt: new Date('2026-02-02'),
        createdBy: 'mgr-001',
        createdByName: 'Nguyen Van A',

        notes: 'Chờ picking',
    },
    {
        id: 'out-003',
        outboundNumber: 'OUT-2026-003',

        customer: 'Công ty XYZ Solutions',
        customerContact: '0912 555 666',
        destination: '789 Võ Văn Tần, Q3, TP.HCM',
        salesOrderRef: 'SO-2026-014',

        warehouse: 'Warehouse Central',

        items: [
            {
                id: 'out-item-005',
                sku: 'CPU-INT-001',
                productName: 'Intel Core i5-12400',
                qtyToPick: 3,
                qtyPicked: 3,
                unit: 'cái',
                pickLocations: [
                    { locationId: 'loc-005', locationCode: 'C-01-01', quantity: 3, sequence: 1 },
                ],
                batchNumber: 'BATCH-2026-02',
            },
        ],

        optimizedRoute: ['C-01-01'],

        status: 'packing',
        expectedShipDate: new Date('2026-02-03'),

        pickedBy: 'staff-002',
        pickedByName: 'Lê Thị C',

        createdAt: new Date('2026-02-02'),
        createdBy: 'mgr-001',
        createdByName: 'Nguyen Van A',

        notes: 'Đã pick xong, đang đóng gói',
    },
];
