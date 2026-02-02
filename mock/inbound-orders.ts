import { InboundOrder } from '@/types/inbound-order';

export const mockInboundOrders: InboundOrder[] = [
    {
        id: 'inb-001',
        inboundNumber: 'IN-2026-001',
        requisitionId: 'req-001',
        requisitionNumber: 'REQ-2026-001',

        supplier: 'Công ty TNHH ABC',
        supplierContact: '0909 123 456',
        poReference: 'PO-2026-045',

        warehouse: 'Warehouse Central',
        warehouseLocation: 'Dock A',

        items: [
            {
                id: 'inb-item-001',
                sku: 'LAP-DEL-001',
                productName: 'Dell Latitude 5520',
                expectedQty: 50,
                receivedQty: 50,
                unit: 'cái',
                batchNumber: 'BATCH-2026-01',
                putawayLocation: 'A-01-03',
                condition: 'good',
            },
            {
                id: 'inb-item-002',
                sku: 'MON-SAM-001',
                productName: 'Samsung 24" Monitor',
                expectedQty: 30,
                receivedQty: 28,
                unit: 'cái',
                batchNumber: 'BATCH-2026-01',
                putawayLocation: 'A-02-01',
                condition: 'good',
                notes: 'Thiếu 2 cái, đã báo supplier',
            },
        ],

        status: 'completed',
        expectedArrivalDate: new Date('2026-02-01'),
        actualArrivalDate: new Date('2026-02-01T09:30:00'),

        receivedBy: 'staff-001',
        receivedByName: 'Trần Văn B',

        carrier: 'Viettel Post',
        trackingNumber: 'VTP123456789',
        billNumber: 'BILL-2026-001',

        createdAt: new Date('2026-01-28'),
        createdBy: 'mgr-001',
        createdByName: 'Nguyen Van A',
        completedAt: new Date('2026-02-01T14:00:00'),

        notes: 'Đã nhận và cất hàng hoàn tất',
    },
    {
        id: 'inb-002',
        inboundNumber: 'IN-2026-002',
        requisitionId: 'req-003',
        requisitionNumber: 'REQ-2026-003',

        supplier: 'Nhà cung cấp XYZ',
        supplierContact: '0912 345 678',
        poReference: 'PO-2026-046',

        warehouse: 'Warehouse Central',

        items: [
            {
                id: 'inb-item-003',
                sku: 'KEY-LOG-001',
                productName: 'Logitech Keyboard K120',
                expectedQty: 100,
                receivedQty: 0,
                unit: 'cái',
            },
            {
                id: 'inb-item-004',
                sku: 'MOU-LOG-001',
                productName: 'Logitech Mouse M100',
                expectedQty: 100,
                receivedQty: 0,
                unit: 'cái',
            },
        ],

        status: 'scheduled',
        expectedArrivalDate: new Date('2026-02-05'),

        createdAt: new Date('2026-02-01'),
        createdBy: 'mgr-001',
        createdByName: 'Nguyen Van A',

        notes: 'Hàng dự kiến về 5/2/2026',
    },
    {
        id: 'inb-003',
        inboundNumber: 'IN-2026-003',

        supplier: 'Intel Vietnam',
        supplierContact: '028 3845 6789',
        poReference: 'PO-2026-047',

        warehouse: 'Warehouse Central',
        warehouseLocation: 'Dock B',

        items: [
            {
                id: 'inb-item-005',
                sku: 'CPU-INT-001',
                productName: 'Intel Core i5-12400',
                expectedQty: 20,
                receivedQty: 15,
                unit: 'cái',
                batchNumber: 'BATCH-2026-02',
                condition: 'good',
            },
        ],

        status: 'receiving',
        expectedArrivalDate: new Date('2026-02-02'),
        actualArrivalDate: new Date('2026-02-02T08:00:00'),

        receivedBy: 'staff-002',
        receivedByName: 'Lê Thị C',

        carrier: 'J&T Express',
        trackingNumber: 'JT987654321',

        createdAt: new Date('2026-01-30'),
        createdBy: 'mgr-001',
        createdByName: 'Nguyen Van A',

        notes: 'Đang kiểm nhận',
    },
];
