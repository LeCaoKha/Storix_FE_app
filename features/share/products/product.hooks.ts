import { useAuthStore } from '@/stores/auth.store';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from './product.api';

export const useProducts = () => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['products', user?.id],
        queryFn: () => getProducts(user?.id || 0),
        enabled: !!user?.id,
    });
};
