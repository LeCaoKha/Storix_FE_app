import { getProducts } from '@/services/product.api';
import { useAuthStore } from '@/stores/auth.store';
import { useQuery } from '@tanstack/react-query';

export const useProducts = () => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['products', user?.companyId],
        queryFn: () => getProducts(user?.companyId || 0),
        enabled: !!user?.companyId,
    });
};
