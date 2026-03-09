# Warehouse Layout & Navigation

## Tính năng

Giao diện quản lý và điều hướng trong kho hàng dành cho Staff, bao gồm:

### 1. Hiển thị Sơ đồ Kho (Warehouse Layout)
- ✅ Hiển thị 2D warehouse layout với zones và shelves
- ✅ Zoom in/out để xem chi tiết
- ✅ Toggle hiển thị navigation graph (nodes & edges)
- ✅ Highlight kệ hàng được chọn
- ✅ Click vào kệ hàng để xem chi tiết

### 2. Chi tiết Kệ Hàng (Shelf Details)
- ✅ Thông tin vị trí (tọa độ x, y, kích thước)
- ✅ Điểm truy cập (access nodes) - phía trước/sau/trái/phải
- ✅ Cấu trúc tầng (levels) và ngăn lưu trữ (bins)
- ✅ Nút "Tìm đường đi đến kệ này"

### 3. Tìm Đường Đi (Pathfinding)
- ✅ Thuật toán Dijkstra tìm đường đi ngắn nhất
- ✅ Hiển thị đường đi trên sơ đồ (highlight path)
- ✅ Hướng dẫn từng bước di chuyển
- ✅ Tính khoảng cách tổng

## API Endpoints

### Backend API
```
GET /api/company-warehouses/{companyId}/warehouses
- Lấy danh sách warehouses của company
- Phân quyền: Company Admin (2), Manager (3), Staff (4)

GET /api/get-warehouse-structure/{companyId}/{warehouseId}
- Lấy cấu trúc warehouse layout đầy đủ
- Response: { width, height, zones[], nodes[], edges[] }
- Phân quyền: Company Admin (2), Manager (3), Staff (4)
```

## Cấu trúc Files

```
app/
  (staff-tabs)/
    warehouse.tsx                    # Main screen

components/
  staff/
    WarehouseLayout.tsx             # SVG 2D layout component
    ShelfDetailModal.tsx            # Chi tiết kệ hàng modal
    PathInstructionsModal.tsx       # Hướng dẫn đường đi modal
    index.ts                        # Export components

hooks/
  warehouse.hooks.ts                # React Query hooks

services/
  warehouse.api.ts                  # API calls

types/
  warehouse.ts                      # TypeScript types

utils/
  pathfinding.ts                    # Dijkstra algorithm
```

## Cách Sử dụng

### 1. Xem sơ đồ kho
```typescript
// Auto-load warehouse đầu tiên
const { data: warehouses } = useWarehouses();
const { data: structure } = useWarehouseStructure(warehouseId);

// Render layout
<WarehouseLayout 
  structure={structure}
  onShelfPress={(shelf, zone) => handleShelfPress(shelf, zone)}
/>
```

### 2. Tìm đường đi
```typescript
import { findShortestPath, findNearestNode } from '@/utils/pathfinding';

const startNode = findNearestNode(nodes, currentX, currentY);
const endNode = findNearestNode(nodes, targetX, targetY);
const path = findShortestPath(nodes, edges, startNode.id, endNode.id);

// Hiển thị path trên layout
<WarehouseLayout 
  structure={structure}
  highlightedPath={path?.path}
/>

// Hiển thị hướng dẫn
<PathInstructionsModal
  visible={true}
  pathResult={path}
  toLocation="Kệ A1"
  onClose={() => {}}
/>
```

## Data Structure

### Warehouse Structure Response
```typescript
{
  width: 700,           // Chiều rộng kho (meter)
  height: 300,          // Chiều cao kho (meter)
  zones: [              // Các khu vực
    {
      id: "ZONE-123",
      code: "Khu A",
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      shelves: [        // Kệ hàng trong khu
        {
          id: "SH-456",
          code: "A1",
          x: 15,
          y: 25,
          width: 20,
          height: 10,
          accessNodes: [  // Điểm truy cập
            { id: "NODE-789", side: "front", x: 15, y: 24 }
          ],
          levels: [       // Tầng
            {
              id: "LV-001",
              code: "Tầng 1",
              bins: [     // Ngăn
                { id: "BIN-111", code: "A1-T1-N1" }
              ]
            }
          ]
        }
      ]
    }
  ],
  nodes: [              // Navigation nodes (đồ thị)
    { id: "NODE-001", x: 10, y: 10, type: "intersection" }
  ],
  edges: [              // Kết nối giữa nodes
    { id: "EDGE-001", from: "NODE-001", to: "NODE-002", distance: 15.5 }
  ]
}
```

## Tính năng Tương lai

- [ ] **QR Code Scanning**: Scan QR code để xác định vị trí hiện tại
- [ ] **Real-time Location**: GPS/Bluetooth beacon tracking
- [ ] **Multi-stop Routing**: Tìm đường đi qua nhiều điểm
- [ ] **Inventory Overlay**: Hiển thị số lượng hàng trên sơ đồ
- [ ] **3D Visualization**: Hiển thị 3D warehouse
- [ ] **Voice Navigation**: Hướng dẫn bằng giọng nói
- [ ] **AR Navigation**: Tích hợp AR để chỉ đường

## Testing

Để test pathfinding algorithm:

```typescript
import { findShortestPath } from '@/utils/pathfinding';

const nodes = [
  { id: '1', x: 0, y: 0 },
  { id: '2', x: 10, y: 0 },
  { id: '3', x: 10, y: 10 },
];

const edges = [
  { id: 'e1', from: '1', to: '2', distance: 10 },
  { id: 'e2', from: '2', to: '3', distance: 10 },
];

const result = findShortestPath(nodes, edges, '1', '3');
console.log(result);
// { path: [...], totalDistance: 20, instructions: [...] }
```

## Troubleshooting

### Không hiển thị warehouse
- Kiểm tra user có được assign warehouse không
- Kiểm tra API response từ backend
- Xem console log để debug

### Path finding không hoạt động
- Kiểm tra navigation graph có đầy đủ nodes/edges không
- Đảm bảo edges kết nối đúng giữa các nodes
- Shelf phải có access nodes

### Performance issues
- Giảm số lượng nodes/edges trong warehouse config
- Sử dụng memoization cho pathfinding
- Cache warehouse structure data

## License

Internal use only - Storix Warehouse Management System
