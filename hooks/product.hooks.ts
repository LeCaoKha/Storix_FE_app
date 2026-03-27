import { getProducts } from '@/services/product.api';
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
