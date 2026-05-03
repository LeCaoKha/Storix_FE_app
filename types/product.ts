export interface ProductPrice {
    id: number;
    productId: number;
    price: number;
    lineDiscount: number;
    date: string;
}

export interface Product {
    id: number;
    name: string;
    description?: string;
    productTypeId?: number;
    companyId: number;
    sku?: string;
    unit?: string;
    image?: string;
    category?: string;
    weight?: number;
    width?: number;
    height?: number;
    length?: number;
    createdAt?: string;
    updatedAt?: string;
    totalQuantity?: number;
    productPrices?: ProductPrice[];
}

/**
 * Get the latest price from a product's price history
 * @param product Product with productPrices array
 * @returns Latest price or 0 if no prices available
 */
export const getLatestPrice = (product: Product | { productPrices?: ProductPrice[] }): number => {
    if (!product.productPrices || product.productPrices.length === 0) {
        return 0;
    }

    // 1. Sort by date descending and use ID descending as tie-breaker
    const sortedPrices = [...product.productPrices].sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.id - a.id;
    });

    // 2. Find the latest NON-ZERO price
    const latestValidPrice = sortedPrices.find(p => p.price > 0);

    // 3. Return the latest non-zero price, or the absolute latest price (even if 0)
    return latestValidPrice ? latestValidPrice.price : (sortedPrices[0].price || 0);
};


export interface ProductResponse {
    id: number;
    name: string;
    description?: string;
    productTypeId?: number;
    typeId?: number;
    companyId: number;
    sku?: string;
    unit?: string;
    image?: string;
    category?: string;
    weight?: number;
    width?: number;
    height?: number;
    length?: number;
    createdAt?: string;
    updatedAt?: string;
    productPrices?: ProductPrice[];
}

export interface ProductType {
    id: number;
    companyId: number;
    name: string;
}

export interface ProductInventoryLocation {
    inventoryLocationId: number;
    inventoryId: number;
    shelfId: number;
    shelfCode?: string | null;
    shelfIdCode?: string | null;
    zoneId?: number | null;
    quantity: number;
    updatedAt?: string | null;
}
