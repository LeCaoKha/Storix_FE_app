import { getProductInventoryLocations, getProducts } from '@/services/product.api';
import { useAuthStore } from '@/stores/auth.store';
import { useQuery } from '@tanstack/react-query';

export const useProducts = () => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['products', user?.id],
        queryFn: () => getProducts(user?.id || 0),
        enabled: !!user?.id,
    });
};

export const useProductInventoryLocations = (productId?: number, warehouseId?: number) => {
    const { user } = useAuthStore();
    const userId = user?.id ?? 0;

    return useQuery({
        queryKey: ['product-inventory-locations', userId, productId, warehouseId],
        queryFn: () => getProductInventoryLocations(userId, productId || 0, warehouseId || 0),
        enabled: !!userId && !!productId && !!warehouseId,
        staleTime: 0,
    });
};
