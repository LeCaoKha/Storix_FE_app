// Warehouse & Route types
export interface RouteStep {
    id: string;
    sequence: number;
    itemId: string;
    itemSku: string;
    itemName: string;
    locationCode: string;
    quantity: number;
    distanceFromPrevious?: number; // in meters
    estimatedTime?: number; // in seconds
    completed: boolean;
}

export interface Location {
    code: string;
    zone: string;
    aisle: string;
    shelf: string;
    capacity: number;
    currentOccupancy: number;
    distanceFromEntry?: number;
}

export interface StorageSuggestion {
    locationCode: string;
    location: Location;
    score: number; // 0-100
    reasoning: string;
    estimatedDistance?: number;
}

export interface ValidationAlert {
    id: string;
    type: 'error' | 'warning' | 'success' | 'info';
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    dismissible: boolean;
}
