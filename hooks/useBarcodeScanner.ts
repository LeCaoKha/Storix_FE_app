import type { OrderItem } from '@/types/order';
import type { ScanError, ScanResult } from '@/types/scanning';
import { useCallback, useState } from 'react';

interface UseBarcodeScanner {
    scanResult: ScanResult | null;
    scanError: ScanError | null;
    isScanning: boolean;
    scanHistory: ScanResult[];
    scan: (code: string, expectedItems: OrderItem[], type: 'item' | 'location', currentLocationCode?: string) => void;
    clearResult: () => void;
    resetScanner: () => void;
}

export function useBarcodeScanner(): UseBarcodeScanner {
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [scanError, setScanError] = useState<ScanError | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);

    const scan = useCallback((
        code: string,
        expectedItems: OrderItem[],
        type: 'item' | 'location',
        currentLocationCode?: string
    ) => {
        setIsScanning(true);
        setScanError(null);

        // Simulate scanning delay
        setTimeout(() => {
            if (type === 'item') {
                // Validate item SKU
                const item = expectedItems.find(i => i.sku === code);

                if (!item) {
                    const error: ScanError = {
                        code: 'ITEM_NOT_FOUND',
                        message: `SKU "${code}" không tìm thấy trong đơn hàng`,
                        suggestedAction: 'Kiểm tra lại mã SKU hoặc đơn hàng'
                    };
                    setScanError(error);

                    const result: ScanResult = {
                        success: false,
                        type: 'item',
                        code,
                        message: error.message,
                        timestamp: new Date(),
                    };
                    setScanResult(result);
                    setScanHistory(prev => [...prev, result]);
                } else {
                    // Check if already picked/received
                    const alreadyScanned = (item.scannedQuantity || 0) >= item.quantity;

                    if (alreadyScanned) {
                        const error: ScanError = {
                            code: 'QUANTITY_EXCEEDED',
                            message: `Đã scan đủ số lượng cho "${item.productName}"`,
                            suggestedAction: 'Kiểm tra lại số lượng cần lấy'
                        };
                        setScanError(error);

                        const result: ScanResult = {
                            success: false,
                            type: 'item',
                            code,
                            message: error.message,
                            timestamp: new Date(),
                            itemId: item.id,
                        };
                        setScanResult(result);
                        setScanHistory(prev => [...prev, result]);
                    } else {
                        const result: ScanResult = {
                            success: true,
                            type: 'item',
                            code,
                            message: `Scan thành công: ${item.productName}`,
                            timestamp: new Date(),
                            itemId: item.id,
                        };
                        setScanResult(result);
                        setScanHistory(prev => [...prev, result]);
                    }
                }
            } else {
                // Validate location
                const result: ScanResult = {
                    success: true,
                    type: 'location',
                    code,
                    message: `Vị trí xác nhận: ${code}`,
                    timestamp: new Date(),
                    locationCode: code,
                };
                setScanResult(result);
                setScanHistory(prev => [...prev, result]);
            }

            setIsScanning(false);
        }, 500); // Simulate scan delay
    }, []);

    const clearResult = useCallback(() => {
        setScanResult(null);
        setScanError(null);
    }, []);

    const resetScanner = useCallback(() => {
        setScanResult(null);
        setScanError(null);
        setIsScanning(false);
        setScanHistory([]);
    }, []);

    return {
        scanResult,
        scanError,
        isScanning,
        scanHistory,
        scan,
        clearResult,
        resetScanner,
    };
}
