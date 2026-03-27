// Warehouse Structure Types từ backend API
export interface WarehouseStructure {
  width: number;
  height: number;
  zones: WarehouseZone[];
  nodes: NavigationNode[];
  edges: NavigationEdge[];
}

export interface WarehouseZone {
  id: string;
  code: string;
  x: number;
  y: number;
  width: number;
  height: number;
  length?: number;
  shelves: Shelf[];
}

export interface Shelf {
  id: string;
  code: string;
  x: number;
  y: number;
  width: number;
  height: number;
  length?: number;
  accessNodes: AccessNode[];
  levels: ShelfLevel[];
}

export interface AccessNode {
  id: string;
  side: 'front' | 'back' | 'left' | 'right';
  x: number;
  y: number;
  radius?: number;
}

export interface ShelfLevel {
  id: string;
  code: string;
  bins: Bin[];
}

export interface Bin {
  id: string;
  code: string;
}

export interface NavigationNode {
  id: string;
  x: number;
  y: number;
  radius?: number;
  side?: string;
  type?: string;
}

export interface NavigationEdge {
  id: string;
  from: string;
  to: string;
  distance: number;
}

// Warehouse Summary (danh sách warehouses)
export interface WarehouseSummary {
  id: number;
  companyId: number;
  name: string;
  status: string;
}

// Path finding result
export interface PathResult {
  path: NavigationNode[];
  totalDistance: number;
  instructions: string[];
}

// Location info with inventory
export interface LocationInfo {
  shelfCode: string;
  levelCode: string;
  binCode: string;
  fullCode: string;
  x: number;
  y: number;
  productId?: number;
  productName?: string;
  quantity?: number;
}