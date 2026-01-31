// Scanning types
export type ScanType = 'item' | 'location';

export interface ScanResult {
    success: boolean;
    type: ScanType;
    code: string;
    message: string;
    timestamp: Date;
    itemId?: string;
    locationCode?: string;
}

export interface ScanError {
    code: 'WRONG_SKU' | 'WRONG_LOCATION' | 'QUANTITY_EXCEEDED' | 'DUPLICATE_SCAN' | 'ITEM_NOT_FOUND' | 'LOCATION_FULL';
    message: string;
    suggestedAction?: string;
}

export interface ScanHistory {
    id: string;
    result: ScanResult;
    itemSku?: string;
    itemName?: string;
}
