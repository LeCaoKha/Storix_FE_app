import { getTasks } from '@/services/task.api';
import { useAuthStore } from '@/stores/auth.store';
import { useQuery } from '@tanstack/react-query';

export const useTasks = () => {
    const { user } = useAuthStore();
    const staffId = user?.id ?? 0;
    const companyId = user?.companyId ?? 0;

    return useQuery({
        queryKey: ['tasks', staffId, companyId],
        queryFn: () => getTasks(staffId, companyId),
        enabled: !!staffId && !!companyId,
    });
};

