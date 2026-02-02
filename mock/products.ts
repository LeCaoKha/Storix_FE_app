export interface Product {
    id: string;
    sku: string;
    name: string;
    category: string;
    stockLevel: number;
    unit: string;
    location?: string;
}

export const mockProducts: Product[] = [
    {
        id: 'p1',
        sku: 'SKU-001',
        name: 'Laptop Dell XPS 15',
        category: 'Electronics',
        stockLevel: 45,
        unit: 'unit',
        location: 'A-01-01',
    },
    {
        id: 'p2',
        sku: 'SKU-002',
        name: 'iPhone 15 Pro',
        category: 'Electronics',
        stockLevel: 120,
        unit: 'unit',
        location: 'A-02-03',
    },
    {
        id: 'p3',
        sku: 'SKU-003',
        name: 'Samsung Galaxy S24',
        category: 'Electronics',
        stockLevel: 85,
        unit: 'unit',
        location: 'A-02-05',
    },
    {
        id: 'p4',
        sku: 'SKU-004',
        name: 'Office Chair Premium',
        category: 'Furniture',
        stockLevel: 30,
        unit: 'unit',
        location: 'B-01-02',
    },
    {
        id: 'p5',
        sku: 'SKU-005',
        name: 'Standing Desk Electric',
        category: 'Furniture',
        stockLevel: 15,
        unit: 'unit',
        location: 'B-01-04',
    },
    {
        id: 'p6',
        sku: 'SKU-006',
        name: 'Wireless Mouse Logitech',
        category: 'Accessories',
        stockLevel: 200,
        unit: 'unit',
        location: 'C-01-01',
    },
    {
        id: 'p7',
        sku: 'SKU-007',
        name: 'Mechanical Keyboard RGB',
        category: 'Accessories',
        stockLevel: 150,
        unit: 'unit',
        location: 'C-01-02',
    },
    {
        id: 'p8',
        sku: 'SKU-008',
        name: 'Monitor 27" 4K',
        category: 'Electronics',
        stockLevel: 60,
        unit: 'unit',
        location: 'A-03-01',
    },
    {
        id: 'p9',
        sku: 'SKU-009',
        name: 'USB-C Hub',
        category: 'Accessories',
        stockLevel: 180,
        unit: 'unit',
        location: 'C-02-01',
    },
    {
        id: 'p10',
        sku: 'SKU-010',
        name: 'Printer Color Laser',
        category: 'Electronics',
        stockLevel: 25,
        unit: 'unit',
        location: 'A-04-01',
    },
    {
        id: 'p11',
        sku: 'SKU-011',
        name: 'Webcam HD 1080p',
        category: 'Electronics',
        stockLevel: 95,
        unit: 'unit',
        location: 'C-03-01',
    },
    {
        id: 'p12',
        sku: 'SKU-012',
        name: 'Headphones Noise Cancelling',
        category: 'Accessories',
        stockLevel: 110,
        unit: 'unit',
        location: 'C-03-02',
    },
];
