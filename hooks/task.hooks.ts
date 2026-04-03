import { getTasks } from '@/services/task.api';
import { useAuthStore } from '@/stores/auth.store';
import { useQuery } from '@tanstack/react-query';

export const useTasks = () => {
    const { user } = useAuthStore();
    const staffId = user?.id ?? 0;
    const companyId = user?.companyId ?? 0;
    const warehouseId = user?.warehouseId;

    return useQuery({
        queryKey: ['tasks', staffId, companyId, warehouseId],
        queryFn: () => getTasks(staffId, companyId, warehouseId),
        enabled: !!staffId && !!companyId,
        staleTime: 0,
    });
};

