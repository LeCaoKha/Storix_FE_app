import { getPaymentStatus } from '@/services/payment.api';
import { useQuery } from '@tanstack/react-query';

export const paymentKeys = {
    all: ['payments'] as const,
    status: (companyId: number) => [...paymentKeys.all, 'status', companyId] as const,
};

export const usePaymentStatus = (companyId: number) => {
    return useQuery({
        queryKey: paymentKeys.status(companyId),
        queryFn: () => getPaymentStatus(companyId),
        enabled: !!companyId,
    });
};
