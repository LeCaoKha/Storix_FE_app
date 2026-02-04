export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  capacity: number;
  zones: Zone[];
}

export interface Zone {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
  type: ZoneType;
  locations: Location[];
}

export interface Location {
  id: string;
  code: string;
  zoneId: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  capacity: number;
  currentOccupancy: number;
  status: LocationStatus;
}

export enum ZoneType {
  RECEIVING = 'receiving',
  STORAGE = 'storage',
  PICKING = 'picking',
  PACKING = 'packing',
  SHIPPING = 'shipping',
}

export enum LocationStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
}