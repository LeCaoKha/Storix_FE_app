import { getTasks } from '@/services/task.api';
import { useQuery } from '@tanstack/react-query';

export const useTasks = () => {
    return useQuery({
        queryKey: ['tasks'],
        queryFn: getTasks,
    });
};

